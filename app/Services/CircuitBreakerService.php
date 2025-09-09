<?php

namespace App\Services;

class CircuitBreakerService
{
    private string $serviceName;
    private int $failureThreshold;
    private int $resetTimeout;
    private int $failureCount = 0;
    private ?int $lastFailureTime = null;
    private bool $isOpen = false;

    public function __construct(
        string $serviceName,
        int $failureThreshold = 3,
        int $resetTimeout = 60
    ) {
        $this->serviceName = $serviceName;
        $this->failureThreshold = $failureThreshold;
        $this->resetTimeout = $resetTimeout;
    }

    public function execute(callable $operation)
    {
        if ($this->isOpen && !$this->shouldAttemptReset()) {
            throw new \RuntimeException("Circuit breaker is open for {$this->serviceName}");
        }

        try {
            $result = $operation();
            $this->recordSuccess();
            return $result;
        } catch (\Exception $e) {
            $this->recordFailure();
            throw $e;
        }
    }

    private function recordSuccess(): void
    {
        $this->failureCount = 0;
        $this->isOpen = false;
    }

    private function recordFailure(): void
    {
        $this->failureCount++;
        $this->lastFailureTime = time();

        if ($this->failureCount >= $this->failureThreshold) {
            $this->isOpen = true;
        }
    }

    private function shouldAttemptReset(): bool
    {
        return time() - $this->lastFailureTime > $this->resetTimeout;
    }

    public function getStatus(): array
    {
        return [
            'service' => $this->serviceName,
            'state' => $this->isOpen ? 'open' : 'closed',
            'failure_count' => $this->failureCount,
            'last_failure' => $this->lastFailureTime,
        ];
    }
}

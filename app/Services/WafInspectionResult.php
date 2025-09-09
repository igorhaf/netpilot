<?php

namespace App\Services;

class WafInspectionResult
{
    public function __construct(
        private bool $isBlocked,
        private ?string $reason = null
    ) {}

    public function isBlocked(): bool
    {
        return $this->isBlocked;
    }

    public function getReason(): ?string
    {
        return $this->reason;
    }
}

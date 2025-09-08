<?php

namespace Tests\Feature;

use App\Services\CircuitBreakerService;
use Tests\TestCase;

class CircuitBreakerTest extends TestCase
{
    public function test_circuit_breaker_closed_state()
    {
        $cb = new CircuitBreakerService('test-service');
        
        $result = $cb->execute(function() {
            return 'success';
        });
        
        $this->assertEquals('success', $result);
        $this->assertEquals('closed', $cb->getStatus()['state']);
    }

    public function test_circuit_breaker_opening()
    {
        $cb = new CircuitBreakerService('test-service', 2, 5);
        
        // First failure
        try {
            $cb->execute(function() {
                throw new \Exception('Failure');
            });
        } catch (\Exception $e) {
            $this->assertEquals(1, $cb->getStatus()['failure_count']);
            $this->assertEquals('closed', $cb->getStatus()['state']);
        }
        
        // Second failure - should open
        try {
            $cb->execute(function() {
                throw new \Exception('Failure');
            });
        } catch (\Exception $e) {
            $this->assertEquals(2, $cb->getStatus()['failure_count']);
            $this->assertEquals('open', $cb->getStatus()['state']);
        }
    }

    public function test_circuit_breaker_reset()
    {
        $cb = new CircuitBreakerService('test-service', 1, 1);
        
        // Cause failure to open circuit
        try {
            $cb->execute(function() {
                throw new \Exception('Failure');
            });
        } catch (\Exception $e) {}
        
        // Wait for reset
        sleep(2);
        
        // Should allow operation again
        $result = $cb->execute(function() {
            return 'success';
        });
        
        $this->assertEquals('success', $result);
        $this->assertEquals('closed', $cb->getStatus()['state']);
    }
}

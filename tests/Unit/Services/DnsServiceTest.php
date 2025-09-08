<?php

namespace Tests\Unit\Services;

use App\Services\DnsService;
use Tests\TestCase;

class DnsServiceTest extends TestCase
{
    public function test_create_record(): void
    {
        $dns = new DnsService('test', []);
        $result = $dns->createRecord('test.com', 'A', '1.1.1.1');
        $this->assertTrue($result);
    }

    public function test_delete_record(): void
    {
        $dns = new DnsService('test', []);
        $result = $dns->deleteRecord('test.com', 'A');
        $this->assertTrue($result);
    }

    public function test_verify_dns_challenge(): void
    {
        $dns = new DnsService('test', []);
        $result = $dns->verifyDnsChallenge('test.com', 'challenge-token');
        $this->assertTrue($result);
    }
}

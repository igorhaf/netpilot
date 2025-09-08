<?php

namespace App\Services;

use App\Models\Webhook;
use App\Models\WebhookEvent;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookDispatcherService
{
    public function dispatch(string $eventType, array $payload): void
    {
        $webhooks = Webhook::where('is_active', true)
            ->whereJsonContains('events', $eventType)
            ->get();

        foreach ($webhooks as $webhook) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Webhook-Signature' => $this->generateSignature($webhook->secret, $payload)
                ])->post($webhook->url, $payload);

                $this->logEvent($webhook, $eventType, $payload, $response->status(), $response->body());
            } catch (\Exception $e) {
                $this->logEvent($webhook, $eventType, $payload, 500, $e->getMessage());
            }
        }
    }

    private function generateSignature(?string $secret, array $payload): string
    {
        if (!$secret) {
            return '';
        }
        return hash_hmac('sha256', json_encode($payload), $secret);
    }

    private function logEvent(Webhook $webhook, string $eventType, array $payload, ?int $statusCode, ?string $responseBody): void
    {
        WebhookEvent::create([
            'webhook_id' => $webhook->id,
            'event_type' => $eventType,
            'payload' => $payload,
            'response_code' => $statusCode,
            'response_body' => $responseBody,
            'attempts' => 1
        ]);
    }
}

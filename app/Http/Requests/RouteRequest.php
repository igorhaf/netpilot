<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RouteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'domain_id' => 'required|exists:domains,id',
            'upstream_id' => 'required|exists:upstreams,id',
            'path_pattern' => 'required|string|max:255',
            'http_method' => 'required|in:GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS,*',
            'priority' => 'nullable|integer|min:1|max:1000',
            'is_active' => 'boolean',
            'strip_prefix' => 'boolean',
            'preserve_host' => 'boolean',
            'timeout' => 'nullable|integer|min:1|max:300',
            'description' => 'nullable|string|max:1000'
        ];
    }

    public function messages(): array
    {
        return [
            'domain_id.required' => 'Please select a domain.',
            'domain_id.exists' => 'The selected domain is invalid.',
            'upstream_id.required' => 'Please select an upstream.',
            'upstream_id.exists' => 'The selected upstream is invalid.',
            'path_pattern.required' => 'Path pattern is required.',
            'http_method.required' => 'HTTP method is required.',
            'http_method.in' => 'Invalid HTTP method selected.',
            'priority.min' => 'Priority must be at least 1.',
            'priority.max' => 'Priority cannot exceed 1000.',
            'timeout.min' => 'Timeout must be at least 1 second.',
            'timeout.max' => 'Timeout cannot exceed 300 seconds (5 minutes).'
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active', true),
            'strip_prefix' => $this->boolean('strip_prefix', false),
            'preserve_host' => $this->boolean('preserve_host', true),
            'priority' => $this->filled('priority') ? (int) $this->priority : 100,
            'timeout' => $this->filled('timeout') ? (int) $this->timeout : 30
        ]);
    }
}

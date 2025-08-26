<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RedirectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'domain_id' => 'required|exists:domains,id',
            'source_pattern' => 'required|string|max:255',
            'target_url' => 'required|url|max:500',
            'redirect_type' => 'required|in:301,302,303,307,308',
            'priority' => 'nullable|integer|min:1|max:1000',
            'is_active' => 'boolean',
            'preserve_query' => 'boolean',
            'description' => 'nullable|string|max:1000'
        ];
    }

    public function messages(): array
    {
        return [
            'domain_id.required' => 'Please select a domain.',
            'domain_id.exists' => 'The selected domain is invalid.',
            'source_pattern.required' => 'Source pattern is required.',
            'target_url.required' => 'Target URL is required.',
            'target_url.url' => 'Target URL must be a valid URL.',
            'redirect_type.required' => 'Redirect type is required.',
            'redirect_type.in' => 'Invalid redirect type selected.',
            'priority.min' => 'Priority must be at least 1.',
            'priority.max' => 'Priority cannot exceed 1000.'
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active', true),
            'preserve_query' => $this->boolean('preserve_query', true),
            'priority' => $this->filled('priority') ? (int) $this->priority : 100,
            'redirect_type' => $this->filled('redirect_type') ? (int) $this->redirect_type : 301
        ]);
    }
}

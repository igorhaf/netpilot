<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpstreamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $upstreamId = $this->route('upstream')?->id;
        $domainId = $this->input('domain_id');

        return [
            'domain_id' => 'required|exists:domains,id',
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:upstreams,name,' . $upstreamId . ',id,domain_id,' . $domainId
            ],
            'target_url' => 'required|url|max:500',
            'weight' => 'nullable|integer|min:1|max:100',
            'is_active' => 'boolean',
            'health_check_path' => 'nullable|string|max:255',
            'health_check_interval' => 'nullable|integer|min:10|max:3600',
            'description' => 'nullable|string|max:1000'
        ];
    }

    public function messages(): array
    {
        return [
            'domain_id.required' => 'Please select a domain.',
            'domain_id.exists' => 'The selected domain is invalid.',
            'name.required' => 'Upstream name is required.',
            'name.unique' => 'An upstream with this name already exists.',
            'target_url.required' => 'Target URL is required.',
            'target_url.url' => 'Target URL must be a valid URL.',
            'weight.min' => 'Weight must be at least 1.',
            'weight.max' => 'Weight cannot exceed 100.',
            'health_check_interval.min' => 'Health check interval must be at least 10 seconds.',
            'health_check_interval.max' => 'Health check interval cannot exceed 3600 seconds (1 hour).'
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active', true),
            'weight' => $this->filled('weight') ? (int) $this->weight : 100,
            'health_check_interval' => $this->filled('health_check_interval') ? (int) $this->health_check_interval : 30
        ]);
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $domainId = $this->route('domain')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/',
                'unique:domains,name' . ($domainId ? ",$domainId" : '')
            ],
            'description' => 'nullable|string|max:500',
            'auto_tls' => 'boolean',
            'is_active' => 'boolean'
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'The domain name must be a valid domain format.',
            'name.unique' => 'This domain name is already registered.'
        ];
    }
}

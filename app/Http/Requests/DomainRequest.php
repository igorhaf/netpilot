<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_id' => 'required|exists:tenants,id',
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/',
                Rule::unique('domains', 'name')
                    ->ignore($this->domain?->id),
            ],
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            'auto_ssl' => 'boolean',
            'dns_records' => 'nullable|array',
            'dns_records.*' => 'string|max:255',
            'force_https' => 'boolean',
            'block_external_access' => 'boolean',
            'internal_bind_ip' => 'nullable|string|ip',
            'security_headers' => 'nullable|array',
            'www_redirect' => 'boolean',
            'www_redirect_type' => 'nullable|string|in:www_to_non_www,non_www_to_www',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome do domínio é obrigatório',
            'name.regex' => 'O nome do domínio deve ter um formato válido (ex: example.com)',
            'name.unique' => 'Este domínio já existe no sistema',
            'name.max' => 'O nome do domínio não pode ter mais de 255 caracteres',
            'description.max' => 'A descrição não pode ter mais de 1000 caracteres',
            'tenant_id.required' => 'O tenant é obrigatório',
            'tenant_id.exists' => 'O tenant selecionado não existe',
        ];
    }
}

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
        return [
            'name' => 'required|string|max:255|unique:domains,name,' . ($this->domain?->id ?? ''),
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
            'auto_ssl' => 'boolean',
            'dns_records' => 'nullable|array',
            'dns_records.*' => 'string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome do domínio é obrigatório',
            'name.unique' => 'Este domínio já existe no sistema',
            'name.max' => 'O nome do domínio não pode ter mais de 255 caracteres',
            'description.max' => 'A descrição não pode ter mais de 1000 caracteres',
        ];
    }
}

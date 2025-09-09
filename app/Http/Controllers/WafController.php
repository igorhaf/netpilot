<?php

namespace App\Http\Controllers;

use App\Services\CloudflareWafService;
use Illuminate\Http\Request;

class WafController extends Controller
{
    public function __construct(
        private CloudflareWafService $waf
    ) {}

    public function index()
    {
        return inertia('Waf/Index', [
            'rules' => [] // Will be populated from Cloudflare API
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'expression' => 'required|string'
        ]);

        $result = $this->waf->createRule(
            $validated['name'],
            $validated['expression']
        );

        return back()->with('success', 'WAF rule created');
    }

    public function update(Request $request, string $ruleId)
    {
        $validated = $request->validate([
            'expression' => 'required|string'
        ]);

        $result = $this->waf->updateRule(
            $ruleId,
            $validated['expression']
        );

        return back()->with('success', 'WAF rule updated');
    }
}

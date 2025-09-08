<?php

namespace App\Services;

use Illuminate\Http\Request;

class WafService
{
    public function inspectRequest(Request $request): WafInspectionResult
    {
        // Default implementation - extend with specific WAF provider logic
        return new WafInspectionResult(false);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CircuitBreakerService;
use Illuminate\Http\Request;

class CircuitBreakerController extends Controller
{
    public function __construct(private CircuitBreakerService $circuitBreaker)
    {
    }

    public function index(Request $request)
    {
        return response()->json([
            'status' => $this->circuitBreaker->getStatus()
        ]);
    }

    public function execute(Request $request)
    {
        $request->validate([
            'service' => 'required|string',
            'operation' => 'required'
        ]);

        try {
            $result = $this->circuitBreaker->execute(
                $request->input('service'),
                $request->input('operation')
            );
            
            return response()->json([
                'status' => 'success',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

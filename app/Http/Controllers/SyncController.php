<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Application\UseCases\SyncProxyConfig;

class SyncController extends Controller
{
    public function index()
    {
        return Inertia::render('Sync');
    }

    public function sync(Request $request)
    {
        try {
            $useCase = new SyncProxyConfig();
            $files = $useCase();
            
            $message = 'Proxy configuration synced successfully. Generated ' . count($files) . ' configuration files.';
            
            if ($request->expectsJson()) {
                return response()->json(['message' => $message, 'files' => count($files)], 200);
            }
            
            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Proxy sync failed: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Failed to sync proxy configuration: ' . $e->getMessage()], 500);
            }
            
            return redirect()->back()->with('error', 'Failed to sync proxy configuration: ' . $e->getMessage());
        }
    }
}

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

    public function sync()
    {
        try {
            $useCase = new SyncProxyConfig();
            $files = $useCase();
            
            $message = 'Proxy configuration synced successfully. Generated ' . count($files) . ' configuration files.';
            
            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Proxy sync failed: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Failed to sync proxy configuration: ' . $e->getMessage());
        }
    }
}

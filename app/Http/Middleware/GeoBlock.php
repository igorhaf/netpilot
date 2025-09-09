<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Stevebauman\Location\Location;

class GeoBlock
{
    public function handle(Request $request, Closure $next)
    {
        $allowedCountries = config('security.allowed_countries', []);
        
        if (empty($allowedCountries)) {
            return $next($request);
        }
        
        $location = app(Location::class)->get($request->ip());
        
        if (!$location || !in_array($location->countryCode, $allowedCountries)) {
            return response()->json(
                ['error' => 'Access from your country is not allowed'], 
                Response::HTTP_FORBIDDEN
            );
        }
        
        return $next($request);
    }
}

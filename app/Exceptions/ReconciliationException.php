<?php

namespace App\Exceptions;

class ReconciliationException extends \RuntimeException
{
    // Route validation errors
    public static function invalidRoute(int $routeId): self
    {
        return new self("Route {$routeId} is missing required domain or upstream");
    }

    // Redirect validation errors
    public static function invalidRedirectPattern(int $redirectId): self
    {
        return new self("Invalid pattern for redirect {$redirectId}");
    }

    // Upstream validation errors
    public static function inactiveUpstream(int $upstreamId): self
    {
        return new self("Upstream {$upstreamId} is inactive");
    }
}

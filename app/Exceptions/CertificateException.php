<?php

namespace App\Exceptions;

class CertificateException extends \RuntimeException
{
    // Domain validation errors
    public static function invalidDomain(string $domain): self
    {
        return new self("Domain {$domain} is invalid or not accessible");
    }

    // Port validation errors
    public static function portsUnavailable(string $domain): self
    {
        return new self("Ports 80 and/or 443 are not available for {$domain}");
    }

    // Certbot execution errors
    public static function certbotFailed(string $error): self
    {
        return new self("Certbot failed: {$error}");
    }

    // Verification errors
    public static function verificationFailed(string $error): self
    {
        return new self("Certificate verification failed: {$error}");
    }

    // File system errors
    public static function writePermission(string $path): self
    {
        return new self("Directory {$path} is not writable");
    }
}

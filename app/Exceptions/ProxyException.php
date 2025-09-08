<?php

namespace App\Exceptions;

class ProxyException extends \RuntimeException
{
    // Configuration errors
    public static function invalidConfig(string $error): self
    {
        return new self("Invalid proxy configuration: {$error}");
    }

    // File operations
    public static function fileSaveFailed(): self
    {
        return new self("Failed to save proxy configuration file");
    }

    public static function fileNotFound(): self
    {
        return new self("Proxy configuration file not found");
    }

    public static function fileCopyFailed(): self
    {
        return new self("Failed to copy proxy configuration file");
    }

    // Service operations
    public static function reloadFailed(string $error): self
    {
        return new self("Failed to reload proxy: {$error}");
    }
}

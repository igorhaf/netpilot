<?php

namespace App\Events;

class WebhookEvents
{
    // Domain Events
    public const DOMAIN_CREATED = 'domain.created';
    public const DOMAIN_UPDATED = 'domain.updated';
    public const DOMAIN_DELETED = 'domain.deleted';

    // Proxy Rule Events
    public const PROXY_RULE_CREATED = 'proxy_rule.created';
    public const PROXY_RULE_UPDATED = 'proxy_rule.updated';
    public const PROXY_RULE_DELETED = 'proxy_rule.deleted';
    public const PROXY_RULE_TOGGLED = 'proxy_rule.toggled';

    // SSL Certificate Events
    public const SSL_CERTIFICATE_ISSUED = 'ssl_certificate.issued';
    public const SSL_CERTIFICATE_RENEWED = 'ssl_certificate.renewed';
    public const SSL_CERTIFICATE_EXPIRING = 'ssl_certificate.expiring';
    public const SSL_CERTIFICATE_EXPIRED = 'ssl_certificate.expired';

    // Upstream Events
    public const UPSTREAM_CREATED = 'upstream.created';
    public const UPSTREAM_UPDATED = 'upstream.updated';
    public const UPSTREAM_DELETED = 'upstream.deleted';
    public const UPSTREAM_HEALTH_CHANGED = 'upstream.health_changed';

    // Deployment Events
    public const DEPLOYMENT_STARTED = 'deployment.started';
    public const DEPLOYMENT_COMPLETED = 'deployment.completed';
    public const DEPLOYMENT_FAILED = 'deployment.failed';
}

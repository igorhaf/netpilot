<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
# netpilot

## Blueprint Index

- ARCHITECTURE: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- MODELS: [`MODELS.md`](./MODELS.md)
- SERVICES: [`SERVICES.md`](./SERVICES.md)
- COMMANDS: [`COMMANDS.md`](./COMMANDS.md)
- FRONTEND: [`FRONTEND.md`](./FRONTEND.md)
- API: [`API.md`](./API.md)

## Blueprint Regeneration Checklist

Follow these steps to update any blueprint without overwriting unrelated content:

1. Identify scope
   - Reference the file and section anchors exactly (e.g., `### 1. Domain Model` in `MODELS.md`).
2. Preserve anchors
   - Do not rename existing headings; add new sections using the documented patterns in each file's "Blueprint Maintenance Protocol".
3. Make additive changes
   - Prefer adding clarifications/notes. If changing contracts (fields, routes, signatures), include a dated note with rationale.
4. Cross-file consistency
   - Keep docs aligned with code in: `app/Models/`, `app/Services/`, `app/Http/Controllers/`, `app/Http/Requests/`, `routes/web.php`, and configs in `config/`.
5. Update Change Log
   - Append a dated entry under the "## Change Log" section of the edited blueprint.
6. Minimal examples
   - Link to source paths (e.g., `app/Infra/Traefik/TraefikProvider.php`) instead of duplicating large code blocks.
7. Validate
   - After edits, skim the other blueprints for impacted references and update as needed.

Tip: Each blueprint now begins with its own "Blueprint Maintenance Protocol" summarizing anchors, regeneration rules, and cross-file contracts.

## Project Status Snapshot (2025-08-31)

- Backend
  - Controllers: Dashboard, Domains, Proxy, SSL, Redirects, Logs, Sync, Upstreams, Routes (autenticado)
  - Models: Domain, ProxyRule, RouteRule, Upstream, SslCertificate, RedirectRule, DeploymentLog, CertificateEvent, User
  - Services: TraefikService, NginxService, LetsEncryptService, SystemCommandService, ReconcilerService
  - Commands: conjunto operacional (deploy/sync/ssl/logs) e testes
  - Rotas: protegidas por `auth`, agrupadas em `routes/web.php`

- Frontend (Vue 3 + Inertia)
  - Páginas: Dashboard, Domains (Index/Create/Edit), Proxy (Index/Create/Edit), SSL (Index/Create), Redirects (Index/Create/Edit), Routes (Index/Create/Edit), Upstreams (Index/Create/Edit), Logs (Index), Sync
  - Autenticação: páginas `Auth/Login.vue` e `Auth/Register.vue`

- Infra & Config
  - Traefik Provider em `app/Infra/Traefik/TraefikProvider.php`
  - Diretório dinâmico: `config('netpilot.dynamic_dir')` (default: `docker/traefik/dynamic`)
  - Variáveis de reconciliação: `RECONCILE_ENABLED`, `RECONCILE_INTERVAL`, `EDGE_PROVIDER`

### Próximos Passos Sugeridos

1. Validar `.env` com chaves de Traefik/LE e reconciliação
2. Executar `php artisan migrate --force` no ambiente alvo
3. Rodar `php artisan proxy:sync` e verificar `docker/traefik/dynamic`
4. Testar renovação: `php artisan proxy:renew --dry-run`
5. Revisar páginas de Index para Routes e Upstreams (presentes) e UX de feedback de sync

## Change Log
- 2025-08-31: Adicionado snapshot de status do projeto e próximos passos.

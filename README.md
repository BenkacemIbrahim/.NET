# Slotly

Slotly is a multi-tenant booking and scheduling platform for clinics, salons,
gyms, and other appointment-based businesses. This repository contains the
ASP.NET Core API foundation and will grow to include the Blazor web application,
tenant-aware scheduling, notifications, billing, and operational tooling.

## Technology stack

- .NET 10, C#, ASP.NET Core Web API, and Blazor Web App
- Clean Architecture: Domain, Application, Infrastructure, and Api
- Entity Framework Core with PostgreSQL
- Hangfire with PostgreSQL storage
- SignalR and Serilog
- xUnit, Testcontainers, and FluentAssertions
- Docker Compose and GitHub Actions

## Prerequisites

- [.NET SDK 10.0.402](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker
  Engine with Docker Compose v2
- Git

## Quick start

Clone the repository, copy `.env.example` to `.env` if you want to override the
safe local defaults, and run:

```bash
docker compose -f docker/compose.yml --profile api up --build -d
```

The local services are then available at:

- API health: <http://localhost:8080/health>
- Swagger UI (Development): <http://localhost:8080/swagger>
- Mailpit: <http://localhost:8025>
- PostgreSQL: `localhost:5433`

To build and test without running the API container:

```bash
dotnet restore Slotly.sln
dotnet build Slotly.sln --configuration Release --no-restore
dotnet test Slotly.sln --configuration Release --no-build
```

PowerShell shortcuts are available through `scripts/slotly.ps1`; run it with
`up`, `down`, `test`, or `migrate`.

## Architecture

Dependencies point inward: Domain has no project dependencies, Application
depends only on Domain, Infrastructure depends on Application, and Api composes
Application and Infrastructure. Architecture details and tenant-boundary design
will be expanded as those components are implemented.

## Features

Sprint 0 provides a production-shaped API host, health endpoint, RFC 7807 error
handling, structured console logging, Swagger, and local PostgreSQL and Mailpit
infrastructure. Product features will be documented here as they ship.

## Deployment

The API has a multi-stage, non-root Docker image and can run through the `api`
Compose profile. Environment-specific deployment guidance will be added when
the first hosted environment is introduced.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and quality
checks. This project is licensed under the [MIT License](LICENSE).

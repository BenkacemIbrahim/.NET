# Contributing to Slotly

## Development workflow

1. Pull the latest `main` branch and commit all work directly to it.
2. Keep changes focused and use Conventional Commit messages.
3. Add or update tests alongside production code.
4. Update documentation and `.env.example` when behavior or configuration changes.
5. Push each verified commit to `main`.

## Required checks

Run these commands before committing:

```bash
dotnet restore Slotly.sln
dotnet build Slotly.sln --configuration Release --no-restore
dotnet test Slotly.sln --configuration Release --no-build
docker compose -f docker/compose.yml config --quiet
```

The build must complete with zero warnings. Integration tests require a running
Docker engine because they use real PostgreSQL containers.

## Code standards

- Preserve the inward Clean Architecture dependency direction.
- Keep nullable reference types enabled and resolve analyzer findings.
- Never commit credentials, tokens, `.env`, or user-secrets.
- Avoid dead code, commented-out code, and production-path test doubles.

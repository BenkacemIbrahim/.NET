=== PROJECT RULES ===

Stack (fixed, do not change without telling me why):
- .NET 10 (LTS), C#, ASP.NET Core Web API, Clean Architecture (Domain, Application, Infrastructure, Api), plus a Blazor Web App frontend.
- EF Core + PostgreSQL (Npgsql). Hangfire for background jobs (PostgreSQL storage). SignalR for realtime. Serilog for logging. xUnit + Testcontainers + FluentAssertions for tests.
- Docker + Docker Compose for all local infrastructure. GitHub Actions for CI/CD.
- Everything must be free to build and run locally. Prefer free/open-source tooling.

Autonomy rules:
- Work completely on your own. Do NOT ask me questions you can answer yourself by reading the repo, the docs or by running a command.
- Do everything you are able to do yourself: install missing tools, run docker compose, create databases, run migrations, generate secrets (JWT keys, passwords) for local use, seed data, run tests, fix failures, create branches, commit and open pull requests if the gh CLI is available.
- Ask me ONLY for things that truly require me: third-party account credentials or tokens you cannot create (for example Stripe test API keys, a hosting account token, a real SMTP password). When you must ask, ask once, list everything you need in one message, and tell me exactly where to get each value and which variable name to set. Never ask me to run commands you can run yourself.
- If a blocker needs me, finish all other work first, then ask.

Real environment rules:
- Build against REAL infrastructure, not mocks or examples: a real PostgreSQL container, a real SMTP server container (Mailpit), real Hangfire storage, and real Stripe in test mode.
- No placeholder code, no TODO stubs, no fake in-memory substitutes in production code paths, no lorem ipsum data. If something is not finished, it is not done.
- Use mocks only inside unit tests, and only for true external boundaries.
- Every feature must actually run: start the stack, call the endpoints, and verify results before you call it finished.

Repository rules (the repo must be GitHub-ready at all times):
- Structure: /src (projects), /tests, /docs, /build or /scripts, /.github (workflows, issue and PR templates), /docker (Dockerfiles, compose files).
- Root files: README.md, LICENSE (MIT), .gitignore, .gitattributes, .editorconfig, global.json, Directory.Build.props, Directory.Packages.props (central package management), CONTRIBUTING.md, CHANGELOG.md, .env.example, AGENTS.md.
- Never commit secrets. Local secrets live in .env (git-ignored) or dotnet user-secrets. Keep .env.example up to date with every variable and a short comment.
- Git workflow: commit all work directly to main using small commits with Conventional Commit messages (feat:, fix:, test:, docs:, chore:, ci:). Do not create sprint branches.
- Commit part by part, never all at once. After each finished task or logical piece (a feature, a migration, a test suite, a doc), build and run the tests, then make a separate commit with a proper Conventional Commit message. Never leave all changes uncommitted until the end of a sprint, and never squash a whole sprint into one commit. Aim for many small, focused, meaningful commits.
- Treat warnings as errors. Enable nullable reference types and analyzers.

Quality rules:
- A sprint is done only when: the solution builds with zero warnings, all tests pass, docker compose up brings the whole stack up from a clean clone, README and docs are updated, and the CI workflow is green.
- Write tests alongside the code (unit tests for domain/application logic, integration tests for API and database using Testcontainers).
- Keep the code clean: small classes, clear naming, no dead code, no commented-out code.

End-of-sprint report (always):
- What was built, how to run it, how to test it, what decisions you made and why, anything that needs my action, and a short list of what the next sprint will do.
=== END RULES ===

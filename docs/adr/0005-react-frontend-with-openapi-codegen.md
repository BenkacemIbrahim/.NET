# ADR 0005: React Frontend with OpenAPI Type Generation

## Context
The user interface consists of customer booking pages and an authenticated tenant administration portal. Manual TypeScript interfaces often drift from backend C# contracts, causing runtime bugs.

## Decision
We chose a modern React 19 + TypeScript stack paired with OpenAPI code generation:
1. **Frontend Tooling**: Vite, React Router, TanStack Query, React Hook Form + Zod, Tailwind CSS v4, Lucide icons, and Radix UI / shadcn/ui components.
2. **Contract Synchronization**: ASP.NET Core emits an OpenAPI v3 document (`/swagger/v1/swagger.json`). `openapi-typescript` compiles the specification into strict TypeScript types (`schema.d.ts`), consumed by `openapi-fetch`.
3. **Serving Architecture**: Packaged into a non-root, multi-stage Alpine Nginx image with proxy pass to the ASP.NET Core API for `/api/` and `/hubs/`.

## Consequences
- **Positive**: 100% type safety across API boundaries; compile-time detection of backend breaking changes; small production bundle (< 370 KB gzipped).
- **Trade-offs**: Requires OpenAPI regeneration (`npm run api:generate`) when backend contracts change.

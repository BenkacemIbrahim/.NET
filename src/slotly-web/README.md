# Slotly web

React and TypeScript frontend for public appointment booking and tenant
administration. The app uses Vite, Tailwind CSS, Radix primitives, TanStack
Query, and a generated OpenAPI client.

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

During local development, `npm run dev` proxies API and SignalR requests to the
ASP.NET Core API configured by the required `VITE_API_URL` value in `.env.local`.

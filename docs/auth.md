# Authentication and Authorization Architecture

Slotly implements a secure, multi-tenant authentication and authorization system using ASP.NET Core Minimal APIs, JWT bearer tokens, and refresh token rotation with reuse detection.

## Key Capabilities

1. **Tenant-Aware Registration (`POST /api/v1/auth/register-tenant`)**:
   - Creates a new `Tenant` entity with slug uniqueness validation.
   - Creates the initial `TenantOwner` user and associated `Staff` profile.
   - Hashes passwords using ASP.NET Core `IPasswordHasher<T>` (PBKDF2 with HMAC-SHA512).
   - Issues an access token (15-minute lifetime) and refresh token (7-day lifetime).

2. **Login & Account Lockout (`POST /api/v1/auth/login`)**:
   - Resolves tenant via `X-Tenant-Id` header, subdomain, or request body (`tenantSlug` / `tenantId`).
   - Validates user credentials against tenant-scoped user store.
   - Enforces automatic lockout: 5 consecutive failed attempts trigger a 15-minute temporary lockout (`423 Locked`).
   - Successful login resets failed attempts and lockout timers.

3. **Refresh Token Rotation & Reuse Detection (`POST /api/v1/auth/refresh`)**:
   - Refresh tokens are cryptographically random 64-byte tokens hashed with SHA-256 before database storage.
   - Refreshing rotates the token: the old token is marked revoked and replaced by the new token hash.
   - **Reuse Detection**: If an already revoked token is presented, the system detects a potential breach, immediately revokes all active refresh tokens in the user's session family, and rejects the request (`401 Unauthorized`).

4. **Multi-Tenant Resolution (`TenantResolutionMiddleware`)**:
   - Extracts tenant identity from `X-Tenant-Id`, `X-Tenant` (GUID or slug), subdomain, or authenticated JWT `tenant_id` claim.
   - Cross-tenant requests are strictly forbidden: if an authenticated token belongs to Tenant A but requests Tenant B, the request is rejected with `403 Forbidden`.

5. **Role-Based Authorization & Policies**:
   - `TenantOwnerOnly`: Restricts administrative actions (e.g., `POST /api/v1/auth/invite-staff`) to tenant owners.
   - `MustBelongToActiveTenantRequirement`: Enforces that the user belongs to the active tenant being accessed.
   - `PlatformAdmin`: Allows administrative access without tenant scoping.

6. **Rate Limiting**:
   - Authentication endpoints are rate-limited to 30 requests per minute per IP using `Microsoft.AspNetCore.RateLimiting` with sliding/fixed windows.

7. **Swagger with JWT Support**:
   - Swagger UI includes Bearer security definitions allowing interactive testing of authenticated endpoints.

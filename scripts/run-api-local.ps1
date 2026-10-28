# Run the Slotly API locally without Docker (uses local PostgreSQL on port 5432)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

# 1. Load .env
$envFile = Join-Path $root '.env'
if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile) {
        if ($line -match '^\s*([^#=\s]+)\s*=\s*(.*)\s*$') {
            $name  = $Matches[1]
            $value = $Matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

# 2. Override Docker-internal hostnames to localhost for direct run
$env:DATABASE_CONNECTION_STRING = "Host=localhost;Port=5432;Database=$env:POSTGRES_DB;Username=$env:POSTGRES_USER;Password=$env:POSTGRES_PASSWORD"
$env:REDIS_CONNECTION_STRING    = "localhost:6379"
$env:SEQ_URL                    = "http://localhost:5341"
$env:SMTP_HOST                  = "localhost"
$env:ASPNETCORE_URLS            = "http://localhost:8080"

# 3. Map flat env vars to ASP.NET Core double-underscore config keys
$env:ConnectionStrings__SlotlyDatabase            = $env:DATABASE_CONNECTION_STRING
$env:Jwt__SigningKey                               = $env:JWT_SIGNING_KEY
$env:Jwt__Issuer                                  = $env:JWT_ISSUER
$env:Jwt__Audience                                = $env:JWT_AUDIENCE
$env:Jwt__AccessTokenLifetimeMinutes              = $env:JWT_ACCESS_TOKEN_LIFETIME_MINUTES
$env:Jwt__RefreshTokenLifetimeDays                = $env:JWT_REFRESH_TOKEN_LIFETIME_DAYS
$env:Smtp__Host                                   = $env:SMTP_HOST
$env:Smtp__Port                                   = $env:SMTP_CONTAINER_PORT
$env:Smtp__FromAddress                            = $env:SMTP_FROM_ADDRESS
$env:Smtp__FromName                               = $env:SMTP_FROM_NAME
$env:Smtp__UseSsl                                 = $env:SMTP_USE_SSL
$env:Redis__ConnectionString                      = $env:REDIS_CONNECTION_STRING
$env:Seq__Url                                     = $env:SEQ_URL
$env:Serilog__MinimumLevel__Default               = $env:LOG_LEVEL
$env:Hangfire__WorkerCount                        = $env:HANGFIRE_WORKER_COUNT
$env:Hangfire__SchemaName                         = $env:HANGFIRE_SCHEMA
$env:BackgroundJobs__PendingBookingExpiryMinutes  = $env:PENDING_BOOKING_EXPIRY_MINUTES
$env:BackgroundJobs__RetentionDays                = $env:BACKGROUND_JOB_RETENTION_DAYS
$env:Stripe__SuccessUrl                           = $env:STRIPE_SUCCESS_URL
$env:Stripe__CancelUrl                            = $env:STRIPE_CANCEL_URL
$env:Tenancy__BaseDomain                          = $env:TENANCY_BASE_DOMAIN
$env:Tenancy__EnableSubdomainResolution           = $env:TENANCY_ENABLE_SUBDOMAIN_RESOLUTION
$env:Tenancy__EnableHeaderResolution              = $env:TENANCY_ENABLE_HEADER_RESOLUTION
$env:RateLimiting__AuthPermitLimit                = $env:RATE_LIMIT_AUTH
$env:RateLimiting__TenantApiPermitLimit           = $env:RATE_LIMIT_TENANT_API
$env:RateLimiting__TenantWriteTokenLimit          = $env:RATE_LIMIT_TENANT_WRITE
$env:Database__AutoMigrateAndSeed                 = $env:DATABASE_AUTO_MIGRATE_AND_SEED
$env:Swagger__Enabled                             = $env:SWAGGER_ENABLED
$env:PublicUrls__Api                              = $env:PUBLIC_API_URL
$env:PublicUrls__Web                              = $env:PUBLIC_WEB_URL
$env:Cors__AllowedOrigins__0                      = $env:CORS_ORIGIN_1
$env:Cors__AllowedOrigins__1                      = $env:CORS_ORIGIN_2
$env:AllowedHosts                                 = $env:ALLOWED_HOSTS

Write-Host "Starting Slotly API on http://localhost:8080 ..." -ForegroundColor Cyan
Set-Location $root
dotnet run --project src/Slotly.Api/Slotly.Api.csproj --no-launch-profile

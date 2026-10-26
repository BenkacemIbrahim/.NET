[CmdletBinding()]
param(
    [switch] $Force
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$rootEnvironmentPath = Join-Path $repositoryRoot '.env'
$webEnvironmentPath = Join-Path $repositoryRoot 'src/slotly-web/.env.local'

if (-not $Force -and ((Test-Path -LiteralPath $rootEnvironmentPath) -or (Test-Path -LiteralPath $webEnvironmentPath))) {
    throw 'A real environment file already exists. Use -Force only when you intentionally want to rotate all local credentials.'
}

function New-RandomHex([int] $ByteCount) {
    $bytes = [byte[]]::new($ByteCount)
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
    }
    finally {
        $generator.Dispose()
    }
    return [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
}

function New-RandomBase64([int] $ByteCount) {
    $bytes = [byte[]]::new($ByteCount)
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
    }
    finally {
        $generator.Dispose()
    }
    return [Convert]::ToBase64String($bytes)
}

$suffix = New-RandomHex 4
$databaseName = "slotly_$suffix"
$databaseUser = "slotly_app_$suffix"
$databasePassword = New-RandomHex 32
$jwtSigningKey = New-RandomBase64 64
$apiUrl = 'http://localhost:8080'
$webUrl = 'http://localhost:3000'

$rootEnvironment = @(
    'COMPOSE_PROJECT_NAME=slotly'
    'ASPNETCORE_ENVIRONMENT=Development'
    'ALLOWED_HOSTS=localhost;127.0.0.1;api'
    "POSTGRES_DB=$databaseName"
    "POSTGRES_USER=$databaseUser"
    "POSTGRES_PASSWORD=$databasePassword"
    'POSTGRES_HOST=postgres'
    'POSTGRES_CONTAINER_PORT=5432'
    'POSTGRES_PORT=5433'
    "DATABASE_CONNECTION_STRING=Host=postgres;Port=5432;Database=$databaseName;Username=$databaseUser;Password=$databasePassword"
    'API_PORT=8080'
    'WEB_PORT=3000'
    "PUBLIC_API_URL=$apiUrl"
    "PUBLIC_WEB_URL=$webUrl"
    'SMTP_HOST=mailpit'
    'SMTP_CONTAINER_PORT=1025'
    'SMTP_PORT=1025'
    'MAILPIT_HTTP_PORT=8025'
    'SMTP_USE_SSL=false'
    'SMTP_USERNAME='
    'SMTP_PASSWORD='
    'SMTP_FROM_ADDRESS=notifications@slotly.local'
    'SMTP_FROM_NAME=Slotly'
    'PENDING_BOOKING_EXPIRY_MINUTES=15'
    'BACKGROUND_JOB_RETENTION_DAYS=30'
    'HANGFIRE_WORKER_COUNT=4'
    'HANGFIRE_SCHEMA=hangfire'
    'STRIPE_SECRET_KEY='
    'STRIPE_WEBHOOK_SECRET='
    "$([string]::Format('STRIPE_SUCCESS_URL={0}/payments/success', $webUrl))"
    "$([string]::Format('STRIPE_CANCEL_URL={0}/payments/cancel', $webUrl))"
    'REDIS_CONNECTION_STRING=redis:6379'
    'REDIS_PORT=6379'
    'SEQ_URL=http://seq:5341'
    'SEQ_HTTP_PORT=8081'
    'SEQ_INGEST_PORT=5341'
    'LOG_LEVEL=Information'
    "JWT_SIGNING_KEY=$jwtSigningKey"
    'JWT_ISSUER=https://slotly.local/api'
    'JWT_AUDIENCE=https://slotly.local/web'
    'JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15'
    'JWT_REFRESH_TOKEN_LIFETIME_DAYS=7'
    'TENANCY_BASE_DOMAIN=slotly.local'
    'TENANCY_ENABLE_SUBDOMAIN_RESOLUTION=true'
    'TENANCY_ENABLE_HEADER_RESOLUTION=true'
    'CORS_ORIGIN_1=http://localhost:3000'
    'CORS_ORIGIN_2=http://127.0.0.1:3000'
    'RATE_LIMIT_AUTH=30'
    'RATE_LIMIT_TENANT_API=120'
    'RATE_LIMIT_TENANT_WRITE=80'
    'DATABASE_AUTO_MIGRATE_AND_SEED=true'
    'SWAGGER_ENABLED=true'
    ''
)

$webEnvironment = @(
    "VITE_API_URL=$apiUrl"
    "VITE_PUBLIC_WEB_URL=$webUrl"
    ''
)

$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($rootEnvironmentPath, $rootEnvironment, $utf8WithoutBom)
[System.IO.File]::WriteAllLines($webEnvironmentPath, $webEnvironment, $utf8WithoutBom)

Write-Host 'Created .env and src/slotly-web/.env.local with unique local credentials.'

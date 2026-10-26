[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('up', 'down', 'test', 'migrate')]
    [string] $Command
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repositoryRoot

try {
    $environmentFile = Join-Path $repositoryRoot '.env'
    if (Test-Path -LiteralPath $environmentFile) {
        foreach ($line in Get-Content -LiteralPath $environmentFile) {
            if ($line -match '^\s*([^#=\s]+)\s*=\s*(.*)\s*$') {
                $name = $Matches[1]
                $value = $Matches[2].Trim().Trim('"').Trim("'")
                Set-Item -Path "Env:$name" -Value $value
            }
        }
    }

    switch ($Command) {
        'up' {
            if (-not (Test-Path -LiteralPath $environmentFile)) {
                throw 'Missing .env. Run scripts/initialize-environment.ps1 first.'
            }
            docker compose --env-file .env -f docker/compose.yml up --build --detach --wait
        }
        'down' {
            docker compose --env-file .env -f docker/compose.yml down
        }
        'test' {
            dotnet test Slotly.sln --configuration Release
        }
        'migrate' {
            foreach ($requiredVariable in @('POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_PORT')) {
                if (-not (Get-Item -Path "Env:$requiredVariable" -ErrorAction SilentlyContinue).Value) {
                    throw "Missing $requiredVariable in .env."
                }
            }
            $databaseName = $env:POSTGRES_DB
            $databaseUser = $env:POSTGRES_USER
            $databasePassword = $env:POSTGRES_PASSWORD
            $databasePort = $env:POSTGRES_PORT
            $env:ConnectionStrings__SlotlyDatabase = "Host=localhost;Port=$databasePort;Database=$databaseName;Username=$databaseUser;Password=$databasePassword"

            dotnet tool restore
            dotnet ef database update `
                --project src/Slotly.Infrastructure `
                --startup-project src/Slotly.Api
        }
    }

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}

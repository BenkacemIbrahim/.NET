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
            docker compose -f docker/compose.yml --profile api up --build --detach
        }
        'down' {
            docker compose -f docker/compose.yml --profile api down
        }
        'test' {
            dotnet test Slotly.sln --configuration Release
        }
        'migrate' {
            $databaseName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { 'slotly' }
            $databaseUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { 'slotly' }
            $databasePassword = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { 'slotly_local_only' }
            $databasePort = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { '5433' }
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

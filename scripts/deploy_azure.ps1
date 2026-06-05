param(
    [string]$ResourceGroup = "rg-aegis-orbit-rm99781",
    [string]$AppName = "app-aegis-orbit-rm99781",
    [string]$PythonVersion = "3.12",
    [string]$SubscriptionId = "8b4e2438-516d-4ebb-8ab0-ba4df86126b8",
    [switch]$SkipTests,
    [switch]$SkipFrontendInstall,
    [switch]$SkipFrontendBuild,
    [switch]$SkipSmokeTest
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "==> $Name"
    & $Command
}

function Assert-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

function New-PosixZip {
    param(
        [string]$SourceDirectory,
        [string]$DestinationZip
    )

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    if (Test-Path -LiteralPath $DestinationZip) {
        Remove-Item -LiteralPath $DestinationZip -Force
    }

    $sourceRoot = (Resolve-Path -LiteralPath $SourceDirectory).Path
    $zip = [System.IO.Compression.ZipFile]::Open($DestinationZip, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Get-ChildItem -LiteralPath $sourceRoot -Recurse -File | ForEach-Object {
            $relativePath = $_.FullName.Substring($sourceRoot.Length).TrimStart("\", "/").Replace("\", "/")
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath) | Out-Null
        }
    }
    finally {
        $zip.Dispose()
    }
}

function New-KuduClient {
    param(
        [string]$ResourceGroup,
        [string]$AppName
    )

    $creds = az webapp deployment list-publishing-credentials --resource-group $ResourceGroup --name $AppName | ConvertFrom-Json
    $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$($creds.publishingUserName):$($creds.publishingPassword)"))
    return @{
        Headers = @{ Authorization = "Basic $basic"; "If-Match" = "*" }
        Base = "https://$AppName.scm.azurewebsites.net/api"
    }
}

function Invoke-KuduCommand {
    param(
        [hashtable]$Client,
        [string]$Command
    )

    $body = @{ command = $Command; dir = "/" } | ConvertTo-Json -Compress
    $result = Invoke-RestMethod -Method Post -Uri "$($Client.Base)/command" -Headers @{ Authorization = $Client.Headers.Authorization } -ContentType "application/json" -Body $body -TimeoutSec 120
    if ($result.ExitCode -ne 0) {
        throw "Kudu command failed: $Command`n$($result.Error)`n$($result.Output)"
    }
}

function Write-KuduVfsFile {
    param(
        [hashtable]$Client,
        [string]$LocalPath,
        [string]$RemotePath
    )

    $fullPath = (Resolve-Path -LiteralPath $LocalPath).Path
    $bytes = [IO.File]::ReadAllBytes($fullPath)
    $uri = "$($Client.Base)/vfs/site/wwwroot/$RemotePath"
    Invoke-RestMethod -Method Put -Uri $uri -Headers $Client.Headers -Body $bytes -ContentType "application/octet-stream" -TimeoutSec 120 | Out-Null
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$frontendDir = Join-Path $repoRoot "frontend"
$distDir = Join-Path $frontendDir "dist"
$packageDir = Join-Path $repoRoot "deploy-package"
$zipPath = Join-Path $repoRoot "deploy.zip"

Set-Location $repoRoot

Assert-Command "az"
Assert-Command "python"
Assert-Command "npm"

Invoke-Step "Validate Azure subscription" {
    $currentSubscriptionId = az account show --query id --output tsv
    if ($currentSubscriptionId -ne $SubscriptionId) {
        throw "Current Azure subscription is $currentSubscriptionId, expected $SubscriptionId. Run az account set --subscription $SubscriptionId and retry."
    }
}

if (-not $SkipTests) {
    Invoke-Step "Install Python dependencies" {
        python -m pip install -r requirements.txt
    }

    Invoke-Step "Run Python tests" {
        python -m pytest
    }
}

if (-not $SkipFrontendInstall) {
    Invoke-Step "Install frontend dependencies" {
        npm ci --prefix frontend
    }
}

if (-not $SkipFrontendBuild) {
    Invoke-Step "Build frontend" {
        npm run build --prefix frontend
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $distDir "index.html"))) {
    throw "Frontend build not found at frontend/dist/index.html. Run npm run build --prefix frontend or remove -SkipFrontendBuild."
}

Invoke-Step "Create deployment package" {
    Remove-Item -Recurse -Force $packageDir, $zipPath -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Path $packageDir, (Join-Path $packageDir "frontend") | Out-Null
    Copy-Item -LiteralPath (Join-Path $repoRoot "requirements.txt") -Destination $packageDir
    Copy-Item -LiteralPath (Join-Path $repoRoot "app") -Destination $packageDir -Recurse
    Copy-Item -LiteralPath $distDir -Destination (Join-Path $packageDir "frontend") -Recurse
    New-PosixZip -SourceDirectory $packageDir -DestinationZip $zipPath
}

Invoke-Step "Configure App Service startup" {
    $startup = "bash -c 'cd /home/site/wwwroot && python -m pip install --no-cache-dir --disable-pip-version-check -r requirements.txt --target /tmp/orbit-guard-python && export PYTHONPATH=/tmp/orbit-guard-python:`${PYTHONPATH:-} && python -m uvicorn app.main:app --host 0.0.0.0 --port `${PORT:-8000}'"
    az webapp config appsettings set --resource-group $ResourceGroup --name $AppName --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false --output none
    az webapp config set --resource-group $ResourceGroup --name $AppName --startup-file $startup --output none
}

Invoke-Step "Deploy current repo state to App Service" {
    $client = New-KuduClient -ResourceGroup $ResourceGroup -AppName $AppName
    Invoke-KuduCommand -Client $client -Command ('/bin/sh -c ' + [char]34 + 'rm -rf /home/site/wwwroot/frontend/dist && mkdir -p /home/site/wwwroot/app /home/site/wwwroot/frontend/dist' + [char]34)
    Write-KuduVfsFile -Client $client -LocalPath "requirements.txt" -RemotePath "requirements.txt"
    Get-ChildItem "app" -Recurse -File | ForEach-Object {
        $relative = $_.FullName.Substring((Resolve-Path "app").Path.Length).TrimStart("\", "/").Replace("\", "/")
        Write-KuduVfsFile -Client $client -LocalPath $_.FullName -RemotePath "app/$relative"
    }
    Get-ChildItem "frontend/dist" -Recurse -File | ForEach-Object {
        $relative = $_.FullName.Substring((Resolve-Path "frontend/dist").Path.Length).TrimStart("\", "/").Replace("\", "/")
        Write-KuduVfsFile -Client $client -LocalPath $_.FullName -RemotePath "frontend/dist/$relative"
    }
    az webapp restart --resource-group $ResourceGroup --name $AppName --output none
}

if (-not $SkipSmokeTest) {
    Invoke-Step "Smoke test public app" {
        $baseUrl = "https://$AppName.azurewebsites.net"
        for ($attempt = 1; $attempt -le 18; $attempt++) {
            try {
                $health = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 30
                Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/" -TimeoutSec 30 | Out-Null
                Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/app/" -TimeoutSec 30 | Out-Null
                Invoke-RestMethod -Uri "$baseUrl/api/status" -TimeoutSec 30 | Out-Null
                Invoke-RestMethod -Uri "$baseUrl/api/conjunctions" -TimeoutSec 30 | Out-Null
                $evasionPayload = @{
                    satellite_id = "AEO-LEO-104"
                    miss_distance_km = 0.42
                    relative_velocity_kms = 12.8
                    collision_probability = 0.00031
                } | ConvertTo-Json
                Invoke-RestMethod -Method Post -Uri "$baseUrl/api/evasion-routing" -ContentType "application/json" -Body $evasionPayload -TimeoutSec 30 | Out-Null
                Write-Host "Smoke test passed: $($health.status) $($health.service) $($health.version)"
                break
            }
            catch {
                if ($attempt -eq 18) {
                    throw
                }
                Start-Sleep -Seconds 20
            }
        }
    }
}

Write-Host ""
Write-Host "Deploy complete: https://$AppName.azurewebsites.net/app/"

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

& (Join-Path $PSScriptRoot "deploy_azure.ps1") `
    -ResourceGroup $ResourceGroup `
    -AppName $AppName `
    -PythonVersion $PythonVersion `
    -SubscriptionId $SubscriptionId `
    -SkipTests:$SkipTests `
    -SkipFrontendInstall:$SkipFrontendInstall `
    -SkipFrontendBuild:$SkipFrontendBuild `
    -SkipSmokeTest:$SkipSmokeTest

param(
    [string]$ResourceGroup = "rg-aegis-orbit-rm99781",
    [string]$Location = "eastus2",
    [string]$AppName = "app-aegis-orbit-rm99781",
    [string]$PlanName = "asp-aegis-orbit-rm99781",
    [string]$WorkspaceName = "law-aegis-orbit-rm99781",
    [string]$InsightsName = "appi-aegis-orbit-rm99781",
    [string]$KeyVaultName = "kv-aegis-rm99781",
    [string]$ActionGroupName = "ag-aegis-orbit-rm99781",
    [string]$AlertName = "alert-aegis-orbit-http5xx",
    [string]$SecretName = "SSA-API-MOCK-TOKEN",
    [string]$SubscriptionId = "8b4e2438-516d-4ebb-8ab0-ba4df86126b8",
    [string]$AlertEmail = "RM99781@fiap.com.br",
    [string]$Sku = "B1"
)

$ErrorActionPreference = "Stop"

Write-Host "Using current Azure CLI session. This script does not run az login."

$currentSubscriptionId = az account show --query id --output tsv
if ($currentSubscriptionId -ne $SubscriptionId) {
    throw "Current Azure subscription is $currentSubscriptionId, expected $SubscriptionId. Run az account set --subscription $SubscriptionId and retry."
}

az config set extension.use_dynamic_install=yes_without_prompt --output none
az provider register --namespace Microsoft.Web --wait --output none
az provider register --namespace Microsoft.KeyVault --wait --output none
az provider register --namespace Microsoft.Insights --wait --output none
az provider register --namespace Microsoft.OperationalInsights --wait --output none

$secretValue = $env:SSA_API_MOCK_TOKEN
if ([string]::IsNullOrWhiteSpace($secretValue)) {
    throw "Set environment variable SSA_API_MOCK_TOKEN before running. Secret value is read from environment, not from code."
}

az group create `
    --name $ResourceGroup `
    --location $Location

az monitor log-analytics workspace create `
    --resource-group $ResourceGroup `
    --workspace-name $WorkspaceName `
    --location $Location

$workspaceId = az monitor log-analytics workspace show `
    --resource-group $ResourceGroup `
    --workspace-name $WorkspaceName `
    --query id `
    --output tsv

az monitor app-insights component create `
    --app $InsightsName `
    --location $Location `
    --resource-group $ResourceGroup `
    --workspace $workspaceId `
    --application-type web

$connectionString = az monitor app-insights component show `
    --app $InsightsName `
    --resource-group $ResourceGroup `
    --query connectionString `
    --output tsv

$instrumentationKey = az monitor app-insights component show `
    --app $InsightsName `
    --resource-group $ResourceGroup `
    --query instrumentationKey `
    --output tsv

az keyvault create `
    --name $KeyVaultName `
    --resource-group $ResourceGroup `
    --location $Location `
    --enable-rbac-authorization true

$vaultScope = az keyvault show `
    --name $KeyVaultName `
    --resource-group $ResourceGroup `
    --query id `
    --output tsv

$currentUserObjectId = az ad signed-in-user show `
    --query id `
    --output tsv

$secretOfficerAssignmentId = az role assignment create `
    --assignee-object-id $currentUserObjectId `
    --assignee-principal-type User `
    --role "Key Vault Secrets Officer" `
    --scope $vaultScope `
    --query id `
    --output tsv 2>$null

$secretSet = $false
for ($attempt = 1; $attempt -le 12; $attempt++) {
    az keyvault secret set `
        --vault-name $KeyVaultName `
        --name $SecretName `
        --value $secretValue `
        --output none

    if ($LASTEXITCODE -eq 0) {
        $secretSet = $true
        break
    }

    Write-Host "Waiting for Key Vault RBAC propagation. Attempt $attempt of 12."
    Start-Sleep -Seconds 10
}

if (-not $secretSet) {
    throw "Could not set Key Vault secret after RBAC propagation wait."
}

if (-not [string]::IsNullOrWhiteSpace($secretOfficerAssignmentId)) {
    az role assignment delete --ids $secretOfficerAssignmentId
}

az appservice plan create `
    --name $PlanName `
    --resource-group $ResourceGroup `
    --location $Location `
    --is-linux `
    --sku $Sku

az webapp create `
    --name $AppName `
    --resource-group $ResourceGroup `
    --plan $PlanName `
    --runtime "PYTHON:3.12" `
    --startup-file "bash -c 'cd /home/site/wwwroot && python -m pip install --no-cache-dir --disable-pip-version-check -r requirements.txt --target /tmp/aegis-python && export PYTHONPATH=/tmp/aegis-python:${PYTHONPATH:-} && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}'"

az webapp update `
    --name $AppName `
    --resource-group $ResourceGroup `
    --https-only true

az webapp config set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --ftps-state Disabled

az webapp identity assign `
    --name $AppName `
    --resource-group $ResourceGroup

$principalId = az webapp identity show `
    --name $AppName `
    --resource-group $ResourceGroup `
    --query principalId `
    --output tsv

az role assignment create `
    --assignee-object-id $principalId `
    --assignee-principal-type ServicePrincipal `
    --role "Key Vault Secrets User" `
    --scope $vaultScope

az webapp config appsettings set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --settings `
        SCM_DO_BUILD_DURING_DEPLOYMENT=false `
        KEY_VAULT_NAME=$KeyVaultName `
        SSA_API_MOCK_TOKEN_SECRET_NAME=$SecretName `
        APPLICATIONINSIGHTS_CONNECTION_STRING=$connectionString `
        APPINSIGHTS_INSTRUMENTATIONKEY=$instrumentationKey

az monitor action-group create `
    --name $ActionGroupName `
    --resource-group $ResourceGroup `
    --short-name "aegissa" `
    --action email ops $AlertEmail

$appResourceId = az webapp show `
    --name $AppName `
    --resource-group $ResourceGroup `
    --query id `
    --output tsv

$actionGroupId = az monitor action-group show `
    --name $ActionGroupName `
    --resource-group $ResourceGroup `
    --query id `
    --output tsv

az monitor metrics alert create `
    --name $AlertName `
    --resource-group $ResourceGroup `
    --scopes $appResourceId `
    --description "AegisOrbit App Service HTTP 5xx alert" `
    --condition "total Http5xx > 5" `
    --window-size 5m `
    --evaluation-frequency 1m `
    --severity 2 `
    --action $actionGroupId

Write-Host "Provisioned AegisOrbit."
Write-Host "App URL: https://$AppName.azurewebsites.net"

# AegisOrbit

AegisOrbit is a FastAPI MVP for Space Situational Awareness (SSA). It helps satellite operators and SSA teams inspect deterministic simulated LEO conjunction alerts and request evasion-routing recommendations.

Team: RM99781  
Primary SDG: ODS 9 - Industry, Innovation and Infrastructure

## Local run

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
python -m pytest
```

Open:

- Landing: `http://127.0.0.1:8000/`
- Dashboard: `http://127.0.0.1:8000/dashboard`
- Swagger: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

## API

- `GET /` - landing page with product purpose, team RM99781, real space problem, and ODS 9.
- `GET /dashboard` - deterministic simulated conjunction alerts.
- `GET /health` - App Service health payload.
- `GET /api/status` - service metadata, config status, Azure readiness.
- `GET /api/conjunctions` - simulated SSA alert feed.
- `POST /api/evasion-routing` - validates input ranges and returns maneuver recommendation, ignition window, estimated delta-v, risk reduction, residual collision probability, and explanation.

Example:

```json
{
  "satellite_id": "AEO-LEO-104",
  "miss_distance_km": 0.42,
  "relative_velocity_kms": 12.8,
  "collision_probability": 0.00031
}
```

## Architecture

The MVP is a cohesive cloud-hosted SSA service:

1. FastAPI receives browser and API traffic.
2. Deterministic simulator returns repeatable orbital conjunction alerts.
3. Evasion-routing logic classifies risk from miss distance and collision probability, then estimates delta-v and risk reduction.
4. Azure App Service hosts the app with HTTPS.
5. Application Insights and Log Analytics provide App Service platform monitoring and request metrics.
6. Key Vault stores the mock SSA token secret by name `SSA-API-MOCK-TOKEN`.
7. Managed Identity receives `Key Vault Secrets User` on the Key Vault scope.

No real external orbital API, database, authentication layer, or paid unbounded integration is included in this MVP.

## Azure provisioning

Script: `scripts/provision_azure.ps1`

It creates:

- Resource Group: `rg-aegis-orbit-rm99781`
- Linux App Service Plan
- Linux App Service
- Log Analytics Workspace
- Application Insights
- Key Vault
- Key Vault secret name: `SSA-API-MOCK-TOKEN`
- System-assigned Managed Identity
- IAM role assignment: `Key Vault Secrets User`
- Action Group
- Metric alert rule for App Service HTTP 5xx
- Email action receiver for alert notifications

Run after Azure CLI is already authenticated:

```powershell
$env:SSA_API_MOCK_TOKEN = "<set outside git>"
.\scripts\provision_azure.ps1 -AppName "app-aegis-orbit-rm99781" -AlertEmail "RM99781@fiap.com.br"
```

The script does not run `az login` and does not store secret values in code.

## CI/CD

Workflow: `.github/workflows/deploy.yml`

Trigger: push to `main`

Required GitHub Secret:

- `AZURE_CREDENTIALS` - service principal JSON for `azure/login`.

Pipeline steps:

1. Checkout.
2. Install Python 3.12 dependencies.
3. Run tests.
4. Azure login after tests using `AZURE_CREDENTIALS`.
5. Deploy to Azure App Service.

Public URL placeholder: `https://app-aegis-orbit-rm99781.azurewebsites.net`

The included `startup.sh` installs the small Python dependency set into `/tmp/aegis-python` before starting Uvicorn. This keeps App Service startup independent from a long remote Oryx build during direct ZIP deployment.

## Evidence checklist

- App public landing page loaded.
- `/dashboard` shows simulated conjunction alerts.
- `/docs` Swagger visible.
- `/api/evasion-routing` response captured.
- Two GitHub Actions deploy runs from two commits on `main`.
- App Service Deployment Center shows deployments.
- Key Vault contains secret name `SSA-API-MOCK-TOKEN`.
- Managed Identity has `Key Vault Secrets User`.
- Application Insights receives traffic.
- Log Stream or Metrics shows requests.
- Alert rule `alert-aegis-orbit-http5xx` exists.

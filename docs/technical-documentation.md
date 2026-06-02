# AegisOrbit Technical Documentation

## Problem and audience

AegisOrbit targets satellite operators and SSA teams that need fast, explainable support during orbital conjunction events. In LEO, debris and dense constellations raise collision risk. Delayed or fuel-heavy avoidance decisions can damage critical communications, Earth observation, and IoT infrastructure.

## Space connection

The service directly simulates an SSA workflow:

- orbital catalog alert ingestion,
- miss-distance and relative-velocity review,
- collision probability risk classification,
- evasion maneuver recommendation.

This is connected to ODS 9 because it protects resilient space infrastructure and supports innovation in orbital operations.

## Stack

- Python 3.12
- FastAPI
- Uvicorn
- Pytest
- Azure App Service for hosting
- Application Insights and Log Analytics for monitoring
- Azure Key Vault for secret storage
- GitHub Actions for CI/CD

## Data flow

1. User opens landing, dashboard, or Swagger docs.
2. FastAPI serves deterministic simulated conjunction alerts.
3. User posts satellite risk inputs to `/api/evasion-routing`.
4. Application validates ranges with Pydantic.
5. Routing logic classifies risk and returns ignition window, delta-v estimate, risk reduction, residual collision probability, and explanation.
6. Azure App Service emits platform metrics and request data to Application Insights / Azure Monitor.

## Azure resources

| Resource | Name |
| --- | --- |
| Resource Group | `rg-aegis-orbit-rm99781` |
| App Service Plan | `asp-aegis-orbit-rm99781` |
| App Service | `app-aegis-orbit-rm99781` |
| Log Analytics | `law-aegis-orbit-rm99781` |
| Application Insights | `appi-aegis-orbit-rm99781` |
| Key Vault | `kv-aegis-rm99781` |
| Key Vault secret | `SSA-API-MOCK-TOKEN` |
| Action Group | `ag-aegis-orbit-rm99781` |
| Alert Rule | `alert-aegis-orbit-http5xx` |

Names with global uniqueness constraints can be overridden by parameters in `scripts/provision_azure.ps1`.

The App Service Plan and App Service use `eastus2` by default because this subscription had Linux B1 capacity available there during provisioning.

## Security

No credentials or secret values are committed. GitHub Actions uses `AZURE_CREDENTIALS` as a GitHub Secret. Azure Key Vault stores the secret named `SSA-API-MOCK-TOKEN`; the provisioning script reads its value from local environment variable `SSA_API_MOCK_TOKEN`.

The App Service uses a system-assigned managed identity. That identity receives the IAM role `Key Vault Secrets User` scoped to the Key Vault.

The provisioning script checks the expected Azure subscription before creating resources. It grants the current signed-in user temporary `Key Vault Secrets Officer` rights to write the demo secret, then removes that assignment when it was created by the script.

## Monitoring

Application Insights is connected through app settings:

- `APPLICATIONINSIGHTS_CONNECTION_STRING`
- `APPINSIGHTS_INSTRUMENTATIONKEY`

The alert rule watches the App Service `Http5xx` metric and fires when total 5xx responses exceed 5 in a 5-minute window. Evidence should include Azure Metrics or Log Stream during test traffic.

The action group includes an email receiver supplied by the `-AlertEmail` parameter in `scripts/provision_azure.ps1`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Landing page |
| GET | `/dashboard` | Simulated conjunction dashboard |
| GET | `/docs` | Swagger UI |
| GET | `/health` | App Service health check |
| GET | `/api/status` | Metadata and Azure readiness |
| GET | `/api/conjunctions` | Deterministic alert feed |
| POST | `/api/evasion-routing` | Maneuver recommendation |

## Public URL

`https://app-aegis-orbit-rm99781.azurewebsites.net`

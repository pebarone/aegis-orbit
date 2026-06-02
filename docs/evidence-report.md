# AegisOrbit Evidence Report

Generated for RM99781.

## Public application

- Public URL: `https://app-aegis-orbit-rm99781.azurewebsites.net`
- HTTPS only: enabled
- App Service location: East US 2
- Runtime: Python 3.12 on Linux App Service

Verified endpoints:

| Check | Result |
| --- | --- |
| `GET /health` | `200 {"status":"healthy","service":"AegisOrbit","version":"0.1.0"}` |
| `GET /dashboard` | `200`, contains `AEO-LEO-104` |
| `GET /docs` | `200`, Swagger UI available |
| `POST /api/evasion-routing` | `200`, returns critical maneuver recommendation |

API response sample:

```json
{
  "satellite_id": "AEO-LEO-104",
  "risk_level": "critical",
  "maneuver_recommendation": "Execute along-track prograde avoidance burn with post-burn tracking confirmation.",
  "ignition_window_utc": "2026-06-03T13:04:00Z/2026-06-03T13:16:00Z",
  "estimated_delta_v_ms": 4.5,
  "risk_reduction_percent": 86.4,
  "residual_collision_probability": 0.00004216
}
```

Screenshots:

- Landing page: `docs/evidence/landing.png`
- Dashboard: `docs/evidence/dashboard.png`
- Swagger: `docs/evidence/swagger.png`

## Azure infrastructure

| Resource | Name | Evidence |
| --- | --- | --- |
| Resource Group | `rg-aegis-orbit-rm99781` | Created |
| App Service Plan | `asp-aegis-orbit-rm99781` | Created |
| App Service | `app-aegis-orbit-rm99781` | Running |
| Log Analytics Workspace | `law-aegis-orbit-rm99781` | Created |
| Application Insights | `appi-aegis-orbit-rm99781` | `provisioningState: Succeeded` |
| Key Vault | `kv-aegis-rm99781` | Created with RBAC |
| Key Vault secret | `SSA-API-MOCK-TOKEN` | Exists, enabled |
| Managed Identity | App Service system identity | Enabled |
| IAM role assignment | `Key Vault Secrets User` | Assigned to App Service principal on Key Vault scope |
| Action Group | `ag-aegis-orbit-rm99781` | Email receiver `RM99781@fiap.com.br` enabled |
| Alert Rule | `alert-aegis-orbit-http5xx` | Enabled, severity 2, metric `Http5xx` |

## Security notes

- No secret values are stored in source code.
- GitHub workflow expects `AZURE_CREDENTIALS` as a repository secret.
- Azure Key Vault stores the mock SSA token under the name `SSA-API-MOCK-TOKEN`.
- Publishing credentials were rotated after a diagnostic command exposed a temporary publish credential in terminal output.

## CI/CD status

Repository:

- `https://github.com/pebarone/aegis-orbit`

Workflow file:

- `.github/workflows/deploy.yml`

GitHub Secret:

- `AZURE_CREDENTIALS` exists in the repository.

Successful GitHub Actions deployment runs:

- `https://github.com/pebarone/aegis-orbit/actions/runs/26793391167`
- `https://github.com/pebarone/aegis-orbit/actions/runs/26793611966`

Later workflow hardening added explicit Kudu write verification so a deploy cannot pass if `startup.sh` or `app/main.py` is missing.

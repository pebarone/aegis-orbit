# DELIVERY INSTRUCTIONS FOR AI AGENT

## EXECUTION CONTEXT
- Platform: Microsoft Azure CLI (Windows, PowerShell)
- Authenticated account:
  - User: RM99781@fiap.com.br
  - Subscription ID: 8b4e2438-516d-4ebb-8ab0-ba4df86126b8
  - Tenant ID: 11dbbfe2-89b8-4549-be10-cec364e59551
  - Tenant Domain: fiap.com.br
  - Account Name: Azure for Students
  - Status: Enabled, already logged in — DO NOT run `az login`

---

## OBJECTIVE
Design and implement a cloud computing solution connected to the Space Industry using Microsoft Azure as the primary platform.

The solution must simulate the cloud infrastructure of a company or product inserted in the space ecosystem. Valid use cases include: orbital data processing, satellite monitoring, remote IoT connectivity, agribusiness with remote sensing, or any other use case with a clear and genuine connection to the Space Industry. Simply naming something "spatial" is insufficient.

---

## DELIVERABLES (5 total)

### 1. Application deployed on Azure App Service
- Deploy a web application (site, API, or dashboard) to Azure App Service
- The application must be publicly accessible via Azure URL
- Required content:
  - Product identity: name, purpose, team
  - Description of the space problem it solves and which SDG (ODS) it connects to
  - Representation of how the solution works (landing page, dashboard with simulated data, or documented API)

### 2. CI/CD Pipeline via GitHub Actions
- All deployments must be automated through a GitHub Actions workflow
- Trigger: `git push` to `main` branch
- Required pipeline steps (in order):
  1. Checkout code
  2. Login to Azure using secure credentials (via GitHub Secret)
  3. Deploy automatically to App Service
- Constraint: Demonstrate at least **2 distinct deploys** (2 different commits generating 2 pipeline executions, visible in the Deployment Center)

### 3. Security practices
- GitHub Secrets: all credentials/secrets must be stored as GitHub Secrets (never hardcoded)
- Azure Key Vault: must be created with at least 1 secret relevant to the solution
- IAM: at least 1 role assignment must be documented

### 4. Monitoring
- Application Insights: must be active and connected to the App Service
- Alert Rule: at least 1 alert rule configured with signal, condition, action group, and severity defined
- Evidence: provide proof of using Log Stream or Metrics during testing

### 5. Technical Documentation (PDF)
- Architecture description with justified decisions
- Organized screenshots with explanations
- Clear connection between the solution and the Space Industry / Global Solution context
- App Service public URL included

---

## GRADING BREAKDOWN (total: 100 pts)

| Criterion                          | Points |
|------------------------------------|--------|
| Solution & Space Industry connection | 15 pts |
| Azure Infrastructure               | 20 pts |
| CI/CD Pipeline                     | 25 pts |
| Security                           | 20 pts |
| Monitoring                         | 10 pts |
| Technical Documentation            | 10 pts |

---

## HARD CONSTRAINTS
- All infrastructure must be created via Azure CLI
- No credentials may appear in code or git history
- HTTPS must be active on the App Service
- The space connection must be substantive, not cosmetic
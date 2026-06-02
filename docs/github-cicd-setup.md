# GitHub CI/CD Setup

This workspace has a local `main` branch, remote `origin`, and workflow file `.github/workflows/deploy.yml`.

Configured repository:

```text
https://github.com/pebarone/aegis-orbit
```

## Create repository

Already completed. Reference command for recreation:

```powershell
gh repo create aegis-orbit --private --source . --remote origin --push
```

Alternative with an existing empty repository:

```powershell
git remote add origin https://github.com/pebarone/aegis-orbit.git
git push -u origin main
```

## Add Azure credential secret

Already completed. Repository secret:

```text
AZURE_CREDENTIALS
```

It contains the service principal JSON expected by `azure/login@v2`. The value is not committed.

## Generate two visible deployments

Already completed. Successful workflow runs:

- `https://github.com/pebarone/aegis-orbit/actions/runs/26793391167`
- `https://github.com/pebarone/aegis-orbit/actions/runs/26793611966`

Reference command for future reruns:

Example:

```powershell
git commit --allow-empty -m "Trigger first Azure deployment"
git push origin main
git commit --allow-empty -m "Trigger second Azure deployment"
git push origin main
```

Validate in:

- GitHub Actions: two successful workflow runs.
- Azure App Service Deployment Center: two deployment entries.

# GitHub CI/CD Setup

This workspace has a local `main` branch with multiple commits and the workflow file `.github/workflows/deploy.yml`.

GitHub setup still needs an authenticated GitHub session because this environment has no `gh` command, no GitHub token, and no configured remote.

## Create repository

Use GitHub Web or an authenticated GitHub CLI session:

```powershell
gh repo create aegis-orbit --private --source . --remote origin --push
```

Alternative with an existing empty repository:

```powershell
git remote add origin https://github.com/<owner>/aegis-orbit.git
git push -u origin main
```

## Add Azure credential secret

Create a GitHub repository secret named:

```text
AZURE_CREDENTIALS
```

It must contain the service principal JSON expected by `azure/login@v2`. Do not commit this value.

## Generate two visible deployments

After `AZURE_CREDENTIALS` exists, push two distinct commits to `main`.

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


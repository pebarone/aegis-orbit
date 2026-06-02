# Plano AegisOrbit

  ## Summary

  Implementar o AegisOrbit, uma API documentada de Space Situational Awareness para monitoramento de conjunções orbitais e sugestão de rotas de evasão em LEO. A conexão espacial é substantiva: simula ingestão de catálogos orbitais,
  cálculo de risco de colisão e geração de manobra de evasão. O projeto atende principalmente à ODS 9, por proteger infraestrutura espacial crítica.

  ## Key Changes

  - Criar uma aplicação FastAPI Python 3.12 com:
      - GET / landing page institucional com nome, propósito, equipe/RM, problema espacial e ODS 9.
      - GET /docs Swagger/OpenAPI público.
      - GET /dashboard painel simples com alertas simulados de conjunção orbital.
      - GET /health health check para App Service.
      - GET /api/status metadados do serviço e status de configuração.
      - POST /api/evasion-routing recebendo satellite_id, miss_distance_km, relative_velocity_kms, collision_probability e retornando recomendação de manobra, janela de ignição, delta-v estimado e redução de risco.

  - Usar dados simulados determinísticos, sem integração externa obrigatória, para evitar dependência de APIs pagas ou instáveis.
  - Criar testes automatizados para health check, status e rota /api/evasion-routing.

  ## Azure, CI/CD e Segurança

  - Provisionar tudo via Azure CLI, sem az login:
      - Resource Group: rg-aegis-orbit-rm99781.
      - Linux App Service Plan.
      - Azure App Service público com HTTPS.
      - Application Insights conectado ao App Service.
      - Log Analytics Workspace.
      - Azure Key Vault com secret relevante, por exemplo SSA-API-MOCK-TOKEN.
      - Managed Identity no App Service.
      - Role assignment documentado: identidade do App Service com permissão Key Vault Secrets User.
      - Alert Rule com action group, severidade e condição, preferencialmente HTTP 5xx ou tempo de resposta.

  - Inicializar Git local e criar repositório GitHub novo.
  - Adicionar workflow .github/workflows/deploy.yml com trigger em push para main:
      - Checkout.
      - Azure login via GitHub Secret AZURE_CREDENTIALS.
      - Instalação/testes.
      - Deploy automático para Azure App Service.

  - Fazer dois commits distintos em main para gerar duas execuções visíveis do pipeline.

  ## Documentação e Evidências

  - Criar README.md e fonte de documentação em Markdown para gerar PDF final.
  - Documentar:
      - Arquitetura e justificativas técnicas.
      - Público-alvo: operadoras de satélites e equipes SSA.
      - Problema real: conjunção orbital, lixo espacial e Síndrome de Kessler.
      - Conexão com ODS 9.
      - Endpoints da API.
      - Recursos Azure criados.
      - Secrets usados sem expor valores.
      - IAM role assignment.
      - URL pública do App Service.

  - Coletar evidências para o PDF:
      - App público carregando.
      - Swagger /docs.
      - Resposta de /api/evasion-routing.
      - GitHub Actions com dois deploys.
      - Deployment Center.
      - Key Vault com secret existente.
      - Role assignment.
      - Application Insights ativo.
      - Log Stream ou Metrics mostrando requisições.
      - Alert Rule configurado.

  ## Test Plan

  - Local:
      - python -m pip install -r requirements.txt

  - Azure:
      - az account show para confirmar assinatura.
      - Validar App Service público via URL HTTPS.
      - Confirmar Application Insights recebendo tráfego.
      - Confirmar Key Vault e role assignment via Azure CLI.
      - Confirmar alert rule criada.

  - CI/CD:
      - Confirmar workflow executando em push para main.
      - Confirmar dois deploys distintos no GitHub Actions/Deployment Center.

  ## Assumptions

  - projectdetails.md define a ideia oficial: AegisOrbit.
  - O formato escolhido é API documentada, com landing/dashboard mínimos para facilitar avaliação e screenshots.
  - O repositório GitHub será criado do zero.
  - Não serão usados segredos em código, commits ou histórico.
  - Caso gh não esteja disponível localmente, a criação/configuração do repositório e secrets pode ser feita pelo GitHub Web, mantendo o deploy via Actions.
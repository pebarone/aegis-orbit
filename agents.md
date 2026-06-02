# 🛰️ Diretrizes de Projeto: Engenharia de Software na Nova Corrida Espacial

## 🌍 Contexto Geral e Visão
A nova geração espacial não é movida apenas por foguetes — é movida por código. Com o software de voo do Falcon 9 rodando em Linux, o rover Perseverance operando com 200 milhões de linhas de instrução e a constelação Starlink coordenada por algoritmos de roteamento em tempo real, a engenharia de software tornou-se o pilar central da exploração e dos serviços orbitais. 

O mercado espacial global, projetado para ultrapassar **US$ 1 trilhão até 2030**, descentralizou-se das agências governamentais para criar um ecossistema privado dinâmico (SpaceX, Planet Labs, Rocket Lab, D-Orbit). O grande vetor de valor migrou da nuvem para a órbita. O desafio atual é conectar essa infraestrutura massiva de dados e conectividade espacial à resolução de problemas críticos na Terra.

---

## 🛠️ Pilares Tecnológicos do Ecossistema
As soluções propostas devem se posicionar em um ou mais dos seguintes domínios:

*   **Sistemas de Missão:** Software de controle, telemetria e sistemas embarcados para satélites/veículos. Foco em tolerância a falhas e precisão de milissegundos.
*   **Dados Orbitais:** Consumo e processamento de imagens satelitais, dados de sensoriamento remoto e APIs espaciais abertas (NASA, ESA, INPE, Copernicus).
*   **Edge em Órbita:** Computação embarcada com restrição severa de hardware, latência crítica e mitigação de efeitos de radiação.
*   **Conectividade Global:** IoT via satélite, redes mesh orbitais e infraestrutura de comunicação para regiões isoladas.

---

## 📋 Diretrizes e Critérios de Execução para a IA
Ao conceber, arquitetar ou analisar projetos dentro deste escopo, a IA deve garantir que a solução atenda rigorosamente aos seguintes parâmetros:

### 1. Clareza do Problema Real
*   Identificar explicitamente o público-alvo/beneficiário, o custo da ineficiência atual e a justificativa do uso de tecnologia espacial em detrimento de abordagens terrestres comuns.

### 2. Arquitetura e Engenharia Integrada
*   A solução deve ser estruturada como um sistema coeso (e não um conjunto de partes isoladas).
*   Definir stack tecnológica viável, fluxo de dados (pipeline de ingestão/processamento) e justificativas técnicas para as escolhas de arquitetura.

### 3. Conexão Espacial Ativa
*   O projeto deve, obrigatoriamente, interagir de forma direta com o ecossistema espacial — seja consumindo dados geoespaciais, simulando software de bordo ou projetando protocolos de comunicação orbital.

### 4. Alinhamento com Objetivos de Desenvolvimento Sustentável (ODS)
Toda solução deve estar vinculada e gerar impacto mensurável em, pelo menos, um dos seguintes ODS prioritários:
*   **ODS 2 (Agricultura Sustentável):** Sensoriamento remoto para otimização de safras e solo.
*   **ODS 9 (Indústria, Inovação e Infraestrutura):** Desenvolvimento de novas ferramentas para a infraestrutura espacial.
*   **ODS 10 (Redução de Desigualdades):** Inclusão digital e conectividade em áreas remotas.
*   **ODS 11 (Cidades e Comunidades Sustentáveis):** Prevenção e resposta a desastres urbanos.
*   **ODS 13 (Ação Contra a Mudança Global do Clima):** Monitoramento de desmatamento, queimadas e emergências climáticas.

### 5. Viabilidade Técnica
*   Embora o escopo exija um protótipo ou concepção de alto nível, os fundamentos de engenharia devem ser realistas e implementáveis com as tecnologias, APIs e restrições de hardware vigentes no mercado atual.
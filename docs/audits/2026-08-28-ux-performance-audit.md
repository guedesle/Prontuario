# Auditoria UX e performance — Prontuário Aprimorado

Data: 2026-08-28

## Escopo

Auditoria da tela de consulta do Prontuário Aprimorado com foco em:

- facilidade de uso durante consulta geriátrica;
- duplicidade entre plano e condutas;
- quantidade de áreas e decisões visíveis ao mesmo tempo;
- carregamento em conexões de internet não ideais;
- chamadas de API redundantes;
- salvaguardas clínicas, persistência e não regressão.

Esta auditoria não altera pontuações, classificações ou diagnósticos de escalas e não autoriza prescrição automática.

## Achados principais

### 1. Plano e condutas estavam conceitualmente duplicados

O `planByProblem` era a mesma fonte de dados, porém o editor principal de condutas havia sido colocado dentro da área de relatório, enquanto o `P — Plano` do SOAP mostrava apenas um resumo e encaminhava a médica para outro bloco. A arquitetura preservava consistência de dados, mas aumentava a carga cognitiva e a navegação.

**Impacto clínico/UX:** a médica precisava compreender que “Plano” e “Condutas” eram a mesma informação em lugares distintos. Isso cria fricção numa consulta de tempo limitado.

**Correção desta release:** `P — Plano e condutas` volta a ser o único editor. Sugestões profissionais aparecem nesse local e permanecem rascunhos que exigem revisão médica e salvamento explícito. O relatório familiar não contém mais uma segunda aba profissional de condutas.

### 2. A página montava todos os módulos clínicos ao abrir

A tela anterior renderizava simultaneamente Problemas, Medicamentos, SOAP, Escalas, Relatório e Finalização. Cada workspace cliente executava suas próprias leituras ao montar, mesmo que a médica ainda não tivesse acessado aquela etapa.

**Impacto:** maior JavaScript inicial, mais hidratação e múltiplas requisições concorrentes. Em conexão de alta velocidade isso pode ficar pouco perceptível; em conexão comum ou instável aumenta o tempo até a tela ficar confortável para uso.

**Correção desta release:** navegação por etapas com carregamento progressivo (`dynamic import`). A consulta inicia em `Evolução e plano`; as demais áreas só são carregadas quando abertas pela primeira vez. Uma etapa já visitada permanece montada e apenas fica oculta, preservando rascunhos locais ao navegar.

### 3. SOAP repetia leituras de medicações e escalas na abertura

Além de buscar a nota clínica, o SOAP buscava imediatamente:

- `/api/consultations/{id}/medications`;
- `/api/consultations/{id}/scales/status`.

Esses dados eram usados principalmente nas funções de cópia, enquanto os workspaces próprios de Medicamentos e Escalas também possuem leituras independentes.

**Correção desta release:** o SOAP carrega apenas a nota clínica ao abrir. Medicações são verificadas quando uma cópia que contém SOAP é solicitada; resultados de escalas são carregados quando a cópia de escalas ou a cópia combinada é solicitada. Alterações posteriores invalidam o cache local em vez de disparar nova leitura automática.

### 4. O workspace de escalas realiza múltiplas chamadas ao ser aberto

Atualmente a área de escalas consulta quatro fontes de API em paralelo: núcleo Freitas, escalas complementares, oncogeriatria e status. O carregamento progressivo evita que isso ocorra na abertura da consulta, mas o custo continua existindo quando a médica entra em Escalas.

**Próxima prioridade técnica:** consolidar o payload de abertura de Escalas em uma única chamada de workspace ou separar definições estáticas de dados clínicos dinâmicos, preservando as regras de licenciamento/fonte e os golden masters.

### 5. Ausência de orçamento formal de performance

O CI valida segurança clínica, isolamento entre pacientes, tipagem, build e golden master, porém não existe atualmente um limite automatizado para:

- tamanho do JavaScript inicial;
- número de requisições na abertura da consulta;
- Core Web Vitals;
- regressão de latência por rota autenticada.

**Correção parcial desta release:** foi criado um contrato de regressão estático garantindo que a página não volte a montar todos os workspaces e que o SOAP não volte a carregar medicações/escalas auxiliares na abertura.

**Próxima prioridade:** adicionar medição real de Web Vitals/Lighthouse em ambiente de teste autenticado e orçamento de bundle/requisições sem armazenar credenciais no repositório.

## Segurança e dívida técnica observada

O pipeline atual continua bloqueando vulnerabilidades críticas, mas a auditoria de dependências registra vulnerabilidades altas transitivas relacionadas à configuração Prisma/deepmerge e ao driver MariaDB. Não deve ser aplicado `npm audit fix --force` sem ensaio de compatibilidade, pois pode introduzir mudança incompatível de Prisma e regressão de banco.

Também existe aviso de manutenção do GitHub Actions relacionado à migração interna de actions baseadas em Node 20 para Node 24. Não é causa da lentidão do usuário final, mas deve entrar no backlog DevOps.

## Priorização

### P0 — feito nesta release

- unificar Plano + Condutas no `P` do SOAP;
- remover editor profissional duplicado da área de Relatório;
- carregar workspaces clínicos sob demanda;
- não buscar medicações e escalas auxiliares do SOAP na abertura;
- preservar rascunhos ao alternar entre etapas;
- manter `noteVersion`, consulta finalizada read-only, isolamento por paciente e salvaguardas de cópia.

### P1 — próxima otimização recomendada

- reduzir as quatro chamadas da tela de Escalas para um fluxo de rede mais compacto;
- instrumentar duração das principais consultas de banco e endpoints clínicos;
- revisar consultas longitudinais do endpoint de nota/medicações para evitar leituras repetidas;
- adicionar Web Vitals e orçamento de bundle/requisições em CI/homologação.

### P2 — manutenção

- atualizar GitHub Actions compatíveis com runtime mais novo;
- revisar vulnerabilidades altas de dependências com plano de migração controlado;
- habilitar cache de build apropriado para reduzir tempo de implantação (não confundir com cache de dados clínicos).

## Critérios de aceite da mudança

1. Ao abrir uma consulta, o usuário vê `Evolução e plano` sem carregar todos os demais workspaces.
2. `P — Plano e condutas` é o único editor do `planByProblem`.
3. Sugestões são opcionais, editáveis e nunca salvas automaticamente.
4. Relatório final não possui uma segunda aba de condutas profissionais.
5. Medicações e escalas usadas pela cópia são buscadas sob demanda.
6. Trocar de etapa não apaga o rascunho de uma etapa já aberta.
7. Consulta finalizada continua somente leitura.
8. Nenhuma lógica de escala, vacina, relatório familiar, medicação, identidade ou autorização é relaxada.

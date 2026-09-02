# ADR-006 — Oncogeriatria: episódio, curso, checkpoint e decisão clínica humana

Status: proposto no PR #173
Data: 2026-09-02

## Contexto

O Prontuário Aprimorado já possui identidade canônica em `Patient.id`, consultas geriátricas, motor de escalas, medicamentos, problemas, documentos, auditoria e Programa 55+ longitudinal. A Oncogeriatria precisa acrescentar uma trajetória própria sem transformar câncer ou tratamento em um segundo prontuário.

## Decisão 1 — episódio oncológico, não cadastro paralelo

`OncogeriatricEpisode` é N:1 com paciente. Isso permite neoplasias distintas ao longo do tempo e preserva a identidade canônica.

## Decisão 2 — curso terapêutico separado de Medication

`OncogeriatricTreatmentCourse` registra modalidade, intenção, linha, esquema e ciclos. Antineoplásicos não são convertidos automaticamente em medicamentos crônicos.

## Decisão 3 — Consultation permanece independente

`ConsultationType` não é alterado. Checkpoints podem apontar opcionalmente para consulta existente. Escalas que exigem `consultationId` só são persistidas quando esse vínculo explícito existe; o sistema não cria consulta artificial.

## Decisão 4 — motor único de escalas

G8 e CARG são registrados em `ScaleDefinition`/`ScaleAssessment`. O checkpoint guarda apenas o ID do assessment correspondente. Nenhuma segunda tabela de pontuações é criada.

## Decisão 5 — cálculo clínico fora do React

Regras G8/CARG ficam em `src/domain/oncogeriatria/calculators.ts`, cobertas por golden masters. Componentes React somente coletam respostas estruturadas e exibem resultados persistidos.

## Decisão 6 — CARG não é motor de tratamento

O CARG estima risco de toxicidade e apresenta categoria. Ele nunca emite recomendação de dose, esquema, suspensão ou contraindicação. Redução de dose e atraso só entram como eventos previamente registrados pelo oncologista.

## Decisão 7 — comparabilidade longitudinal versionada

Δ geriátrico e gráficos não misturam versões diferentes do mesmo instrumento. Mudança numérica não recebe automaticamente rótulo de melhora/piora sem regra clínica validada.

## Decisão 8 — privacidade e auditoria

Todas as gravações têm autoria e AuditEvent. Logs técnicos não armazenam conteúdo clínico sensível. Rotas validam paciente + episódio + curso/checkpoint para reduzir IDOR horizontal.

## Decisão 9 — snapshot próprio sem alterar DocumentType

Na v1, `OncogeriatricReportSnapshot` é entidade aditiva porque `DocumentSnapshot` exige `consultationId` e um `DocumentType` compartilhado. Alterar essas estruturas existentes apenas para encaixar o novo relatório aumentaria risco de regressão. A assinatura digital existente permanece intocada.

## Decisão 10 — feature safety

`ONCOGERIATRIA_EMERGENCY_DISABLED=true` desativa apenas a área nova. O rollback preferencial é de código, preservando tabelas/dados novos.

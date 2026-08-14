# Validação v7 — AGA, identidade e medicações

Data: 2026-08-13

## Resultado local

- 105 testes de domínio aprovados, sem falhas ou testes ignorados;
- Prisma schema validado;
- Prisma Client regenerado;
- TypeScript completo aprovado com `--noEmit --incremental false`;
- build Next.js 16 de produção aprovado;
- `git diff --check` aprovado.

## Novas coberturas

- normalização de nome por espaços, caixa e acentuação;
- duplicidade por nome/data e por identificador forte;
- preservação de homônimos com datas diferentes;
- formato mínimo de CPF/CNS;
- múltiplos horários em uma única linha de medicamento;
- rejeição de frequência/horário no texto do medicamento;
- relatório AGA com dado, resultado, interpretação, proposta, intervenção, fonte e evolução;
- ausência de escala sem pontuação inventada;
- relatório antes da finalização;
- preservação de problemas resolvidos e bloqueio de mistura de pacientes;
- regressão de SOAP, relatório familiar, snapshots e regras clínicas do golden master.

## Testes MySQL implementados

`tests/integration/clinical-integrity.test.ts` cobre:

- duas criações concorrentes da mesma identidade;
- chaves compostas de isolamento para escala, medicamento, problema e documento.

Esses dois testes exigem um banco MySQL exclusivo em `TEST_DATABASE_URL`. Eles não foram executados nesta rodada porque nenhum banco sintético dedicado estava configurado; usar o banco clínico ou uma URL não identificada para testes seria inseguro.

## Homologação ainda obrigatória

- aplicar as migrations em MySQL vazio de teste;
- executar a suíte de integração;
- testar o backfill v6→v7 em cópia restaurada;
- revisar candidatos a duplicidade e medicações com `needsScheduleReview`;
- homologar formulário, impressão A4 e exportação no navegador;
- completar `GO_LIVE_CHECKLIST.md` antes de dados reais.

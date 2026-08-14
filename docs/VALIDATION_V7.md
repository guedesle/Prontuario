# Validação v7 — AGA, identidade e medicações

Data: 2026-08-14

## Resultado local

- 110 testes de domínio aprovados, sem falhas ou testes ignorados;
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
- ECOG 0–5 e CRASH–MNA-SF local com limites versionados e aviso de revisão clínica.

## Testes MySQL executados

`tests/integration/clinical-integrity.test.ts` cobre:

- duas criações concorrentes da mesma identidade;
- chaves compostas de isolamento para escala, medicamento, problema e documento.

O workflow de CI cria um MySQL 8.4 efêmero e exclusivo, aplica as migrations com `prisma migrate deploy` e executa os dois testes por `TEST_DATABASE_URL`. A execução de 2026-08-14 foi aprovada no commit `e5843ab` (GitHub Actions run `31788582329`). Nenhum banco clínico é usado nesses testes.

O mesmo workflow aprovou o roundtrip cifrado de backup/restauração sintética, `npm ci`, Prisma Client, testes clínicos, typecheck completo, build de produção e auditoria de dependências críticas.

## Homologação ainda obrigatória

- aplicar as migrations em MySQL vazio de teste;
- executar a suíte de integração;
- testar o backfill v6→v7 em cópia restaurada;
- revisar candidatos a duplicidade e medicações com `needsScheduleReview`;
- homologar formulário, impressão A4 e exportação no navegador;
- completar `GO_LIVE_CHECKLIST.md` antes de dados reais.

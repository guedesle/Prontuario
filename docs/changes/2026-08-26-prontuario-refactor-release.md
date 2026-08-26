# Release — Refatoração clínica e operacional 2026-08-26

## Identificador

`2026-08-26-prontuario-refactor-v1`

## Escopo desta release

- Reconciliação medicamentosa com frequência estruturada: diária, semanal, mensal e se necessário.
- Programação semanal/mensal explícita e persistente.
- Bloqueio fail-closed da emissão do plano enquanto uma programação semanal/mensal ativa estiver incompleta.
- Vias de administração estruturadas, preservando registros legados sem inferir via ausente.
- Impressão do plano sem transformar frequência semanal/mensal em administração diária.
- Separação mais rígida entre orientações educativas para paciente/família e condutas médicas/profissionais.
- Testes de regressão ampliados para contrato HTTP, snapshot, segurança familiar e release exata.

## Compatibilidade e dados

Não há migration nova nesta release. Os campos `frequency`, `schedule` e `needsScheduleReview` já existem em `MedicationRegimen`. Regimes legados sem frequência explícita continuam sendo lidos de forma compatível: `AS_NEEDED` é inferido somente quando o único momento estruturado é `se_necessario`; nos demais casos o fallback é `DAILY`.

Registros legados sem via permanecem sem via até revisão explícita — a interface não deve preenchê-los automaticamente como via oral.

## Gates de implantação

1. CI do release candidate deve concluir verde: repository safety, backup/restore, MySQL integration, golden master, typecheck, build e audit de dependências críticas.
2. Merge em `main` somente após o gate acima.
3. O build Hostinger deve concluir o `release:clinical:prestart` com `CLINICAL_RELEASE=PRESTART_OK` antes de compilar/publicar.
4. O endpoint `/api/health` em produção deve expor `releaseId: 2026-08-26-prontuario-refactor-v1` com `Cache-Control: no-store`.
5. O workflow `Production Clinical Smoke` deve retornar `CLINICAL_RELEASE=SMOKE_OK` para o SHA exato da `main`.
6. Se o smoke não confirmar a release exata, considerar produção desatualizada/falha e não declarar implantação concluída.

## Smoke funcional mínimo pós-deploy

Com paciente sintético e sessão autorizada, verificar:

- abrir cadastro e consulta;
- cadastrar medicamento diário e conferir horários;
- cadastrar medicamento semanal e mensal com programação completa;
- confirmar que programação incompleta bloqueia impressão do plano;
- atualizar dose/via/frequência sem alterar retrospectivamente consulta anterior;
- abrir SOAP, escalas e relatório familiar;
- confirmar que o relatório familiar não contém prescrição, ajuste de dose, solicitação automática de exames ou encaminhamento automático;
- confirmar persistência após recarregar a página;
- confirmar acesso anônimo bloqueado.

## Rollback

Não realizar rollback de banco por improvisação. Como esta release não adiciona migration, um rollback de aplicação para o último SHA estável deve ser avaliado primeiro. Qualquer restauração de banco exige snapshot/backup e plano explícito de recuperação.

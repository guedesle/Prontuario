# Migração v7 — identidade, medicações e relatório AGA

## Escopo

A v7 acrescenta prevenção transacional de duplicidade de pacientes, horários estruturados de medicação, integridade composta paciente-consulta e snapshot do relatório AGA independente da finalização.

O repositório já possuía a migration local `20260813191431_init`, mas `*.sql` fazia com que ela não fosse rastreada pelo Git. A v7 passa a versionar essa migration inicial e acrescenta `20260813233000_aga_v7` como migration incremental. Banco existente continua exigindo backup, homologação e conferência dos backfills antes do deploy.

## Antes de qualquer banco existente

1. criar e validar backup conforme `BACKUP_RESTORE.md`;
2. restaurar uma cópia em homologação;
3. comparar contagens de pacientes, consultas, escalas, problemas, medicações e snapshots;
4. executar a análise de duplicidades e de horários abaixo;
5. somente então preparar uma migration aditiva específica para o banco existente.

## Pacientes

- preencher `normalizedFullName` com a mesma função de `src/domain/patient-identity.ts`;
- gerar `identityFingerprint` com nome normalizado e data de nascimento;
- não unir nem apagar registros automaticamente;
- grupos com fingerprint repetido recebem discriminadores distintos e `needsIdentityReview=true`;
- CPF, CNS e identificadores internos só entram em `PatientIdentifier` após normalização e conferência;
- a unicidade padrão é ativada depois do relatório de colisões ter sido revisado.

Homônimos verdadeiros permanecem como pacientes distintos. A confirmação exige ação explícita e evento de auditoria.

## Medicações

- preservar `frequency` e `schedule` legados durante a transição;
- converter somente expressões inequívocas para `MedicationScheduleSlot`;
- marcar `needsScheduleReview=true` quando a semântica for ambígua;
- nunca presumir que `2x/dia` significa manhã e noite;
- manter o texto original até a revisão médica;
- após homologação, a escrita nova usa exclusivamente horários estruturados.

## Documentos

- `AGA_REPORT` é um tipo adicional; snapshots anteriores permanecem imutáveis;
- `sourceConsultationStatus` registra se a fonte estava em rascunho, revisão ou finalizada;
- `generatedById` registra autoria da geração;
- gerar prévia sempre cria snapshot; imprimir e exportar reutilizam o snapshot selecionado;
- `finalizedAt` não é preenchido automaticamente apenas porque a consulta está finalizada.

## Integridade

As relações de `ClinicalProblem`, `ProblemEvent`, `ScaleAssessment`, `MedicationRegimen` e `DocumentSnapshot` usam chaves compostas com `patientId`. Isso faz o banco rejeitar referências cruzadas entre pacientes, além das validações de serviço.

## Validação pós-migração

- `prisma validate` e `prisma generate`;
- suíte unitária completa;
- `tests/integration/clinical-integrity.test.ts` contra MySQL exclusivo de testes;
- teste concorrente de cadastro;
- teste de isolamento paciente-consulta;
- geração de relatório em `DRAFT`, `IN_REVIEW` e `FINALIZED`;
- conferência de SOAP, relatório familiar e plano de medicamentos;
- inspeção manual da impressão A4.

# Modelo de dados clínico longitudinal

## Patient
Registro mestre do paciente.

Campos centrais:
- id;
- nome;
- data de nascimento;
- sexo;
- escolaridade;
- contatos;
- baselineConsultationId;
- createdAt/updatedAt.

## Consultation
Uma consulta pertence a exatamente um paciente e um médico.

Tipos:
- `AGA_INITIAL`;
- `FOLLOW_UP`.

Estados:
- `DRAFT`;
- `IN_REVIEW`;
- `FINALIZED`.

A primeira AGA finalizada pode ser registrada como baseline do paciente.

## ClinicalProblem
Problema longitudinal, não uma simples linha de texto de uma consulta.

Tipos:
- `CLINICAL`;
- `GERIATRIC`.

Status:
- `ACTIVE`;
- `STABLE`;
- `MONITORING`;
- `RESOLVED`.

Campos:
- título;
- descrição;
- origem;
- consultationId de origem;
- datas;
- status atual.

## ProblemEvent
Histórico de mudanças do problema:
- criação;
- mudança de status;
- mudança de descrição/prioridade;
- resolução;
- reativação.

Nunca apagar evento clínico já finalizado.

## ScaleDefinition
Catálogo versionado das regras do instrumento:
- code;
- version;
- nome;
- status de procedência;
- configuração serializada;
- ativo/inativo.

Uma versão nunca deve ser alterada retroativamente depois de usada em consulta finalizada. Nova regra = nova versão.

## ScaleAssessment
Resultado de instrumento em uma consulta:
- patientId;
- consultationId;
- scaleCode;
- scaleVersion;
- answers JSON;
- score;
- classification;
- interpretation;
- clinicalColor;
- scaleDefinitionId quando disponível;
- appliedAt.

O histórico de escalas é a fonte dos gráficos.

## Medication
Entidade longitudinal do medicamento:
- nome;
- apresentação;
- via;
- status.

## MedicationRegimen
Posologia válida em determinado período:
- dose;
- frequência;
- horários;
- instruções;
- data de início/fim;
- consultationId de origem.

Isso evita sobrescrever silenciosamente a prescrição anterior.

## DocumentSnapshot
Documento gerado e aprovado:
- tipo (`SOAP`, `FAMILY_REPORT`, `MEDICATION_PLAN`);
- patientId;
- consultationId;
- version;
- content JSON/HTML;
- generatedAt;
- finalizedAt;
- finalizedBy.

## AuditEvent
Registra eventos importantes:
- usuário;
- entidade;
- ação;
- identificador;
- valor anterior/novo quando aplicável;
- timestamp.

## Regra de integridade principal
Nenhum `DocumentSnapshot`, `ScaleAssessment`, `ProblemEvent` ou `MedicationRegimen` pode apontar para paciente diferente daquele da consulta associada.

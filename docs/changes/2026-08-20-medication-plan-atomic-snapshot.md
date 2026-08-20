# Geração atômica do plano de medicamentos

## Objetivo
Eliminar a janela conhecida entre a leitura do workspace medicamentoso e a persistência do `DocumentSnapshot` de `MEDICATION_PLAN`.

## Alterações
- o contexto medicamentoso pode ser lido com um `Prisma.TransactionClient` já existente;
- a escrita de `DocumentSnapshot` foi extraída para uma função transacional reutilizável, mantendo derivação de paciente, versionamento e auditoria no mesmo contexto;
- `generateMedicationPlan` agora exige as mesmas permissões de leitura e geração documental e executa leitura do workspace, leitura da identidade consulta → paciente, construção do modelo e persistência do snapshot dentro de uma única transação `Serializable`;
- a transação inteira permanece protegida pelo retry já usado para colisões de versão (`P2002`) e conflitos/deadlocks serializáveis (`P2034`).

## Segurança
- `patientId` continua sendo derivado no servidor e nunca aceito do cliente;
- `UNKNOWN` e `current-record-only` continuam bloqueando a geração pelo contrato fail-closed já existente;
- nenhuma medicação, dose, via, frequência, horário, status ou decisão terapêutica foi criada, inferida ou alterada;
- snapshot e evento de auditoria continuam sendo gravados juntos;
- falha da consulta dentro da transação impede criação de snapshot e auditoria.

## Testes
Foi adicionado golden master para o escritor transacional de snapshots, cobrindo derivação de paciente, versionamento, usuário gerador, auditoria e falha fechada quando a consulta não existe.

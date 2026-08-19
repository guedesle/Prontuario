# Higiene do repositório

## 2026-08-19 — remoção de artefato acidental na raiz

Foi identificado o arquivo `import { prisma } from ..db;.txt` na raiz do repositório. O conteúdo era uma cópia antiga e não compilada de rotinas hoje mantidas em `src/server/clinical/persistence.ts`.

A implementação ativa possui salvaguardas adicionais que não existiam no artefato, incluindo validação estruturada do plano medicamentoso, vínculo de `patientId` derivado da consulta, versionamento serializável de snapshots e registro de auditoria.

O arquivo `.txt` não deve ser usado como fonte de código ou documentação e foi removido em uma alteração isolada, sem mudança de comportamento da aplicação.

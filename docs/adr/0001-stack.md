# ADR 0001 — Stack da nova aplicação

**Status:** proposta adotada para a migração inicial

## Contexto
O legado é um arquivo HTML único com CSS e JavaScript embutidos. Ele contém boa parte das regras clínicas, escalas, intervenções, geração de relatório e resumo para prontuário, porém não possui uma camada persistente de banco de dados, autenticação, auditoria ou modelo longitudinal robusto.

O objetivo é preservar o máximo de regras JavaScript validadas durante a migração e reduzir o risco de regressão.

## Decisão

### Aplicação
- Next.js 16 (App Router)
- TypeScript
- React
- execução Node.js

### Banco
- MySQL relacional
- Prisma ORM

### Hospedagem
- Hostinger com suporte a Node.js/Next.js
- deploy a partir do GitHub
- banco MySQL gerenciado no mesmo ecossistema quando o plano contratado permitir

## Motivos
1. Reaproveitamento de lógica JavaScript do legado.
2. Tipagem para reduzir erros de domínio.
3. Backend e frontend no mesmo projeto, sem necessidade de dois deploys no primeiro estágio.
4. Banco relacional adequado a paciente, consulta, problemas, escalas, medicamentos, documentos e auditoria.
5. Evolução futura para múltiplos médicos sem exigir mudança imediata de arquitetura.
6. Deploy compatível com a infraestrutura Hostinger já adotada.

## Decisões de arquitetura
- Regras clínicas ficam em `src/domain`, sem dependência de React.
- Persistência fica em `src/server`.
- UI fica em `src/app` e `src/components`.
- Configurações de escalas ficam versionadas.
- Documentos são renderizados a partir de dados estruturados e salvos como snapshots.
- Não usar o HTML gerado como fonte primária da informação clínica.

## Consequências
- A migração inicial exige extrair regras do arquivo legado.
- Cada regra clínica extraída deve receber testes de regressão.
- O arquivo legado será mantido em `/legacy` apenas como referência até a conclusão da migração.

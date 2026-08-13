# Relatório de validação — v4

Data da rodada: 2026-08-12

## Resultado
- 56 testes executados
- 56 aprovados
- 0 falhas
- 0 ignorados

## Novas coberturas da v4
- Zarit institucional de 7 itens (1–5 por item)
- lacuna documental explícita no escore 22 da Zarit institucional
- FAST: estágios discretos e faixas do golden master
- PPS: níveis discretos e faixas de apresentação do golden master
- ESAS: soma global e destaque independente de sintomas >= 7
- comparação longitudinal:
  - mesmo paciente
  - mesmo instrumento
  - mesma versão
  - atual × anterior
  - atual × baseline
  - direção maior=melhor / maior=pior

## Segurança
- versões diferentes retornam `not-comparable`;
- Zarit incompleta retorna estado cinza;
- valor Zarit 22 não é classificado por inferência;
- CFS permanece pendente até definição de versão/fonte;
- repositório público não deve receber dados reais de pacientes.

## Validação de tipagem
Os módulos TypeScript de domínio alterados na rodada passaram na checagem isolada com `tsc --noEmit`.

A validação Prisma/full-stack depende da instalação local das dependências do projeto (`npm install` + `prisma generate`).

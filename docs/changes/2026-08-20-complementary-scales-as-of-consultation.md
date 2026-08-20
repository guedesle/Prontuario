# Escalas complementares respeitam o horizonte da consulta

## Contexto

O endpoint de leitura das escalas complementares selecionava o resultado mais recente do paciente sem limitar a busca ao momento da consulta aberta. Em uma consulta histórica, isso podia exibir um resultado registrado em uma consulta posterior.

## Alteração

- A leitura agora calcula o horizonte longitudinal da consulta alvo com a mesma ordenação determinística já usada pelos relatórios (`occurredAt`, `createdAt`, `id`).
- A consulta ao banco inclui somente `ScaleAssessment` vinculados às consultas pertencentes a esse horizonte.
- A linha temporal continua *fail-closed*: mistura de pacientes é rejeitada pelo domínio.
- A gravação, os cálculos, pontos de corte, classificações e interpretações das escalas não foram alterados.

## Testes

Golden masters cobrem exclusão de consulta futura e rejeição de linha temporal contendo paciente diferente.

## Segurança clínica

A mudança evita vazamento temporal em revisão retrospectiva e mantém o histórico coerente com o estado conhecido até a consulta selecionada. Nenhuma conduta, diagnóstico ou intervenção é inferida a partir dessa correção.

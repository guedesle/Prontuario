# ADR 0003 — Consulta sem reaplicação na trajetória de capacidade

## Status

Aceito para `intrinsic-capacity-model-v1.1.0`.

## Contexto

Na versão 1.0.0, uma consulta sem reaplicação interrompia a comparação entre duas avaliações posteriores do mesmo instrumento e versão. Isso preservava a ausência, mas também eliminava uma trajetória válida entre dois resultados efetivamente medidos.

## Decisão

- A consulta sem reaplicação continua visível como dado ausente e nunca recebe valor zero ou estado herdado.
- Dois resultados do mesmo instrumento e versão permanecem comparáveis mesmo quando existe uma consulta intermediária sem reaplicação.
- O trecho que atravessa essa ausência é tracejado e recebe explicação textual de que não representa estabilidade no intervalo.
- Registro indeterminado, contextual ou de instrumento/versão incompatível continua interrompendo a linha.
- Marcos clínicos apenas documentam coincidência temporal; o software não atribui causalidade.

## Consequências

O histórico permanece fiel aos pontos medidos e explicita simultaneamente a ausência de medição intermediária. Snapshots anteriores mantêm sua versão metodológica original.

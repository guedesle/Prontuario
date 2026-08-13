# Longitudinalidade das escalas

## Objetivo
Responder com segurança à pergunta clínica: **“O que mudou desde a última consulta e desde a AGA inicial?”**

## Unidade de comparação
Uma série temporal só é automaticamente comparável quando possui simultaneamente:
- mesmo paciente;
- mesmo `scaleCode`;
- mesma `scaleVersion`;
- escore numérico disponível.

Se qualquer requisito falhar, a engine retorna `not-comparable` ou `insufficient-data`.

## Direção do escore
A direção é configurada por instrumento:
- `higher-better`: aumento numérico é favorável (ex.: Barthel, Lawton, PPS);
- `higher-worse`: aumento numérico é desfavorável (ex.: GDS-15, Pfeffer, FAST, ESAS).

Isso descreve **direção do escore**, não significância clínica. A aplicação não deve afirmar que uma mudança pequena é clinicamente importante sem uma regra específica validada para aquele instrumento.

## Comparações mostradas
Para cada instrumento:
1. atual × consulta anterior;
2. atual × AGA/baseline;
3. série cronológica completa para gráfico.

## Versionamento
`ScaleDefinition` guarda a definição versionada do instrumento. `ScaleAssessment` mantém:
- código e versão usados;
- respostas;
- escore;
- classificação;
- cor clínica emitida;
- interpretação;
- consulta e paciente.

Mesmo que uma configuração futura mude, o resultado histórico continua rastreável.

## Interface futura
Exemplo seguro:

`Barthel: 80 → 70 → 60  | tendência numérica desfavorável`

Evitar transformar automaticamente isso em “piora clínica significativa” sem regra de mudança clinicamente importante documentada.

## ESAS
A ESAS exige dois eixos no histórico:
- soma global;
- cada sintoma individual.

Um sintoma isolado intenso não pode desaparecer visualmente porque a soma total está em uma faixa baixa.

## FAST
FAST é ordinal. A trajetória deve mostrar o estágio selecionado e sua progressão. Mudança abrupta ou perda fora da sequência esperada deve ser apresentada como **alerta para avaliação de causa intercorrente**, não automaticamente como progressão de demência.

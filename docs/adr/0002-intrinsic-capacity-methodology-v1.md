# ADR 0002 — Metodologia versionada para capacidade intrínseca e independência funcional

Status: Proposto em branch para revisão clínica/científica

Data: 2026-08-22

## Contexto

O gráfico longitudinal existente convertia a cor clínica persistida de cada escala em três estados (`preserved`, `attention`, `altered`) e, quando múltiplos instrumentos pertenciam ao mesmo domínio, utilizava o pior estado observado.

Essa regra era simples e clinicamente intuitiva, porém misturava instrumentos com construtos, propriedades psicométricas e finalidades diferentes. Também permitia ligar temporalmente resultados de instrumentos diferentes como se fossem diretamente comparáveis.

## Decisão

Adotar `intrinsic-capacity-model-v1.0.0` com as seguintes regras:

1. independência funcional permanece separada dos cinco domínios de capacidade intrínseca;
2. nenhum escore global de capacidade intrínseca é criado;
3. cada relação instrumento-domínio recebe papel metodológico (`anchor`, `assessment`, `indicator`, `screening`, `context`), força de mapeamento e base da evidência;
4. a regra “pior resultado vence” é removida;
5. rastreio positivo gera sinal de atenção, não confirmação de redução;
6. instrumentos contextuais não definem o estado do domínio;
7. evidências de mesma prioridade discordantes produzem estado `indeterminate`;
8. trajetórias são ligadas apenas quando instrumento e versão são iguais;
9. missing interrompe comparabilidade e não significa estabilidade;
10. o eixo temporal usa intervalo real entre consultas;
11. o ponto mantém resultado original, versão, classificação, fonte e hash da definição quando disponíveis;
12. eventos clínicos podem ser associados temporalmente, mas o software não infere causalidade;
13. vitalidade v1 usa MNA-SF apenas como indicador nutricional proxy, com limitação explícita;
14. a UI permanece no design system clínico já aprovado e não vira uma ferramenta estatística visualmente complexa.

## Consequências positivas

- maior validade de construto;
- redução de falsa comparabilidade;
- proveniência auditável;
- versão metodológica explícita;
- base mais adequada para protocolo prospectivo;
- menor risco de transformar uma heurística de cores em suposta medida científica.

## Trade-offs

- mais estados `recorded`/`indeterminate` aparecerão quando a evidência não permite conclusão segura;
- algumas linhas ficarão interrompidas quando o instrumento mudar;
- o gráfico poderá parecer menos “contínuo”, mas será metodologicamente mais honesto;
- vitalidade permanece parcialmente operacionalizada;
- a persistência atual ainda não materializa observações derivadas versionadas por domínio.

## Trabalho obrigatório futuro antes de pesquisa prospectiva

1. persistir `missing_reason`;
2. separar `eventOccurredAt` de `eventRecordedAt`;
3. materializar estados derivados versionados ou criar mecanismo equivalente que impeça reinterpretação silenciosa histórica;
4. definir instrumentos sensoriais padronizados;
5. congelar uma âncora cognitiva principal para o protocolo;
6. validar o modelo de vitalidade;
7. revisar licenças de uso eletrônico;
8. realizar consenso de especialistas e estudo de validade.

## Alternativas rejeitadas

### Soma/média das escalas

Rejeitada por misturar unidades e construtos incomparáveis.

### Normalização arbitrária de todos os instrumentos

Rejeitada por produzir falsa precisão sem validação psicométrica.

### “Pior resultado vence”

Rejeitada como regra geral por permitir que screening, contexto e assessment tenham peso indevidamente equivalente.

### Carregar o último resultado para frente

Rejeitada porque transforma ausência de avaliação em aparente estabilidade.

### Inferir causalidade por proximidade temporal

Rejeitada. Relação temporal não é causalidade.

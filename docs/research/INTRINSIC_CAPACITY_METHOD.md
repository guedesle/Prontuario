# Capacidade intrínseca e independência funcional — método v1

Status: proposta implementada em branch para revisão, ainda não validada clinicamente como instrumento novo.

Versão metodológica vigente: `intrinsic-capacity-model-v1.1.0` (a base v1.0.0 abaixo foi preservada; o tratamento de consulta intermediária sem reaplicação está documentado no ADR 0003).

## 1. Princípio central

O Prontuário aprimorado não cria um escore global de capacidade intrínseca. O sistema preserva os resultados originais de cada instrumento e produz apenas uma representação categórica, auditável e versionada por domínio.

A representação deve responder clinicamente se há manutenção, sinal de atenção ou redução observada em um domínio, sem sugerir precisão psicométrica inexistente e sem combinar aritmeticamente instrumentos incomparáveis.

## 2. Quatro níveis de afirmação

### 2.1 Definição oficial da OMS

A OMS define capacidade intrínseca como a combinação das capacidades físicas e mentais que o indivíduo pode mobilizar. A operacionalização clínica utiliza cinco domínios: locomoção, cognição, capacidade psicológica, vitalidade e capacidade sensorial.

A OMS define functional ability como resultado da capacidade intrínseca, do ambiente e da interação entre ambos. Por isso, Katz, Lawton e Barthel não são rotulados no aplicativo como medida completa de `functional ability` da OMS. A camada clínica usa o termo **independência funcional**.

### 2.2 Evidência empírica

A literatura mostra associação entre capacidade intrínseca e desfechos como incapacidade, hospitalização e mortalidade, mas persiste heterogeneidade importante na escolha de instrumentos, construção de índices e especialmente na operacionalização da vitalidade.

Não existe índice composto universal de capacidade intrínseca validado para adoção clínica geral.

### 2.3 Decisão metodológica do aplicativo

O modelo v1:

- mantém independência funcional separada da capacidade intrínseca;
- não soma, não calcula média e não normaliza MoCA, MEEM, SPPB, SARC-F, GDS, MNA-SF, Katz, Lawton ou qualquer outro instrumento heterogêneo;
- classifica cada instrumento por papel metodológico: `anchor`, `assessment`, `indicator`, `screening` ou `context`;
- usa uma hierarquia predefinida, em vez da regra “o pior resultado vence”;
- trata rastreio positivo como **sinal de atenção**, não como confirmação de redução do domínio;
- trata resultados discordantes de mesma prioridade como **indeterminados/discordantes**;
- exige o mesmo instrumento e a mesma versão para ligar dois pontos como trajetória comparável;
- mantém `não avaliado` separado de `estável`;
- exige proveniência do ponto exibido;
- não infere causalidade a partir de eventos clínicos temporalmente próximos.

### 2.4 Hipóteses que exigem pesquisa

Ainda precisam de validação prospectiva:

- se os estados categóricos do modelo v1 possuem validade convergente e discriminante;
- se a trajetória por domínio prediz declínio funcional futuro;
- se um indicador nutricional como MNA-SF é suficiente para a operacionalização clínica inicial do componente de vitalidade;
- se algum crosswalk entre instrumentos diferentes pode ser validado futuramente;
- se um escore quantitativo agregado de capacidade intrínseca pode ser construído. Nenhum escore agregado deve ser implantado clinicamente antes dessa validação.

## 3. Estados do domínio

| Estado | Significado |
| --- | --- |
| `not-assessed` | nenhum instrumento metodologicamente mapeado foi registrado na consulta |
| `recorded` | há informação relacionada, mas ela não confirma um estado comparável do domínio |
| `indeterminate` | evidências de mesma prioridade são discordantes ou tecnicamente não conciliáveis |
| `preserved` | nenhum sinal de redução foi detectado por instrumento apropriado; na UI: “Sem redução detectada” |
| `attention` | rastreio positivo ou alteração que exige avaliação complementar; na UI: “Sinal de atenção” |
| `altered` | redução identificada por instrumento com regra metodológica aplicável |

“Sem redução detectada” não equivale a ausência de doença ou garantia de capacidade integral preservada.

## 4. Matriz instrumento × domínio

### Independência funcional

| Instrumento | Papel v1 | Relação com o construto | Pode definir estado? |
| --- | --- | --- | --- |
| Katz | assessment | FORTE — ABVD | sim |
| Lawton | assessment | FORTE — AIVD | sim |
| Barthel | assessment | FORTE — independência funcional/ABVD | sim |
| Pfeffer | assessment | FORTE para funcionamento complexo por informante | sim |
| ECOG | context | INDIRETA | não |
| KPS | context | INDIRETA | não |

Katz, Lawton, Barthel e Pfeffer não são somados. Se instrumentos de mesma prioridade discordarem, a visão resumida fica indeterminada e os resultados originais permanecem visíveis.

### Locomoção

| Instrumento | Papel v1 | Relação | Pode definir estado? |
| --- | --- | --- | --- |
| SPPB | anchor | FORTE | sim |
| velocidade de marcha | assessment | FORTE | sim |
| sentar-levantar 5x | assessment | ACEITÁVEL/FORTE como componente | sim |
| POMA | assessment | ACEITÁVEL | sim |
| força de preensão | assessment | ACEITÁVEL como componente | sim |
| SARC-F | screening | ACEITÁVEL como rastreio | somente atenção quando positivo |
| FRAIL-BR | context | INDIRETA | não |

Quando SPPB está presente, ele tem precedência sobre rastreios. O SARC-F positivo não confirma redução locomotora.

### Cognição

| Instrumento | Papel v1 | Relação | Pode definir estado? |
| --- | --- | --- | --- |
| MoCA / versão brasileira persistida | assessment | FORTE | sim |
| MEEM | assessment | FORTE | sim |
| 10-CS | screening | ACEITÁVEL | somente como rastreio |
| Mini-Cog | screening | ACEITÁVEL | somente como rastreio |
| relógio | screening | ACEITÁVEL | somente como rastreio |
| IQCODE | screening | ACEITÁVEL | somente como rastreio |
| FAST | context | INADEQUADA como medida cognitiva direta | não |
| CAM | context | INADEQUADA para trajetória cognitiva basal | não |
| Pfeffer | context | INDIRETA para cognição | não |

MoCA e MEEM não são considerados intercambiáveis longitudinalmente. Troca de instrumento quebra a linha de comparabilidade até que exista crosswalk validado.

### Capacidade psicológica

| Instrumento | Papel v1 | Relação | Pode definir estado? |
| --- | --- | --- | --- |
| GDS-15 | anchor operacional | ACEITÁVEL/FORTE para sintomas depressivos | sim |
| Cornell | assessment | ACEITÁVEL, especialmente em demência | sim |
| CES-D | assessment | ACEITÁVEL | sim |
| ISI | context | INADEQUADA como definidor do domínio | não |

A ISI permanece relevante para sono, mas gravidade de insônia não é tratada como equivalente a capacidade psicológica.

### Vitalidade

Vitalidade é o domínio com maior incerteza operacional.

A OMS propôs uma definição fisiológica que envolve energia/metabolismo, função neuromuscular e resposta imune/ao estresse. Revisões recentes mostram predomínio de marcadores nutricionais, antropométricos e força muscular, com validação de construto ainda limitada.

| Instrumento | Papel v1 | Relação | Pode definir estado? |
| --- | --- | --- | --- |
| MNA-SF | indicator | ACEITÁVEL como proxy nutricional | sim, com rótulo explícito de proxy |
| FRAIL-BR | context | INDIRETA | não |

O sistema nunca afirma que MNA-SF seja equivalente ao construto fisiológico completo de vitalidade.

### Capacidade sensorial

Visão e audição devem permanecer identificáveis nos detalhes. Não são somadas. Se resultados de mesma prioridade discordarem, o resumo do domínio pode ficar indeterminado.

Os instrumentos sensoriais utilizados em pesquisa deverão ter método, versão, unidade e regra de interpretação explicitamente documentados antes do protocolo prospectivo.

## 5. Longitudinalidade

A linha do gráfico só liga pontos quando `comparabilityKey = instrumento@versão` permanece igual.

Exemplos:

- SPPB v1 → SPPB v1: comparável;
- SPPB v1 → SARC-F v1: não comparável;
- Lawton v1 → Barthel v1: não comparável;
- MoCA v1 → MEEM v1: não comparável;
- Lawton v1 → Lawton v2: não comparável.

O eixo X usa tempo real entre consultas.

Uma consulta sem dado comparável interrompe a trajetória. O sistema não carrega o último valor para frente.

## 6. Pontos de inflexão

Ponto de inflexão significa apenas mudança observada entre duas avaliações comparáveis consecutivas.

Evento clínico associado significa coexistência temporal de um registro clínico, nunca causalidade automática.

Arquitetura alvo futura:

- `ClinicalEvent`;
- `eventOccurredAt`;
- `eventRecordedAt`;
- `ObservedDomainChange`;
- `TemporalAssociation`;
- `CausalAssertion`, somente quando explicitamente documentada por médico.

O modelo atual ainda não possui campo separado para `eventOccurredAt`; esta lacuna deve ser resolvida antes de uso prospectivo formal em pesquisa.

## 7. Versionamento

Alterações em mapeamento, hierarquia, estado ou comparabilidade exigem nova versão metodológica.

Exemplo:

- `intrinsic-capacity-model-v1.0.0`;
- `intrinsic-capacity-model-v2.0.0`.

Snapshots de documentos já emitidos preservam a versão gravada. Uma futura versão deve armazenar também observações derivadas persistentes por domínio para impedir reinterpretação silenciosa da visão longitudinal dinâmica.

## 8. UX

A UI segue o design system “Minimal Clinical Premium — Geriatric HealthTech” já adotado no projeto:

- fundo claro;
- ameixa/roxo institucional;
- baixa carga visual;
- cards discretos;
- bordas suaves;
- acessibilidade;
- print-first;
- responsividade real.

A visão clínica permanece simples. Proveniência, instrumento, versão, classificação e justificativa são detalhes auditáveis, não ruído permanente na tela.

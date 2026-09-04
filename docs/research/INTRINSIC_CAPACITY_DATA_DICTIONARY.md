# Dicionário de dados — capacidade intrínseca e independência funcional

Versão metodológica: `intrinsic-capacity-model-v1.1.0`

Este dicionário define o núcleo mínimo necessário para reprodutibilidade científica. A aplicação pode conter campos adicionais, mas nenhum ponto do gráfico deve perder os campos de origem abaixo.

| Código | Nome | Domínio | Definição / unidade | Origem | Missing / versionamento |
| --- | --- | --- | --- | --- | --- |
| `patient_id` | paciente | todos | identificador interno; em exportação científica deve ser pseudonimizado | Patient | obrigatório |
| `consultation_id` | consulta | todos | consulta clínica de origem | Consultation | obrigatório |
| `assessment_id` | avaliação | todos | identificador da aplicação do instrumento | ScaleAssessment | obrigatório para proveniência científica |
| `assessed_at` | data da avaliação | todos | data/hora de aplicação | ScaleAssessment.appliedAt | não imputar silenciosamente |
| `consultation_occurred_at` | data da consulta | todos | data clínica da consulta | Consultation.occurredAt | obrigatório |
| `domain_code` | domínio | todos | funcionalidade, locomoção, cognição, psicológico, vitalidade ou sensorial | regra metodológica | versionado |
| `instrument_code` | instrumento | todos | código estável da escala/medida | ScaleAssessment.scaleCode | obrigatório |
| `instrument_version` | versão do instrumento | todos | versão aplicada | ScaleAssessment.scaleVersion | obrigatório para comparabilidade |
| `instrument_role` | papel metodológico | todos | anchor / assessment / indicator / screening / context | metodologia v1 | versionado |
| `mapping_strength` | força de mapeamento | todos | strong / acceptable / indirect / inadequate | metodologia v1 | versionado |
| `evidence_basis` | base da evidência | todos | direct / proxy / screening / context | metodologia v1 | versionado |
| `score_numeric` | escore numérico | instrumento | unidade original do instrumento | ScaleAssessment.scoreNumeric | `null` quando não aplicável ou ausente; nunca converter para zero |
| `score_text` | resultado textual | instrumento | forma textual persistida | ScaleAssessment.scoreText | preservar original |
| `classification_original` | classificação original | instrumento | classificação produzida pela regra da escala | ScaleAssessment.classification | preservar original |
| `interpretation_original` | interpretação original | instrumento | interpretação persistida | ScaleAssessment.interpretation | preservar original |
| `clinical_color_original` | cor clínica original | instrumento | verde/amarelo/vermelho/cinza | ScaleAssessment.clinicalColor | apenas camada de origem; não é unidade psicométrica |
| `source_citation` | fonte | instrumento | referência bibliográfica ou institucional da definição | ScaleDefinition.sourceCitation | ausente = não declarar regra como plenamente validada |
| `definition_hash` | hash da definição | instrumento | hash da configuração aplicada | ScaleDefinition.definitionHash | útil para auditoria e reprodutibilidade |
| `methodology_model_version` | versão do modelo | todos | ex. `intrinsic-capacity-model-v1.1.0` | derivação | obrigatório |
| `domain_state` | estado do domínio | domínio | not-assessed / recorded / indeterminate / preserved / attention / altered | derivação versionada | nunca substituir dado original |
| `domain_state_reason` | justificativa | domínio | razão legível da classificação derivada | derivação versionada | obrigatório |
| `selected_for_domain_state` | evidência selecionada | domínio | booleano que informa quais instrumentos contribuíram para o estado | derivação versionada | obrigatório |
| `comparability_key` | chave de comparabilidade | longitudinal | `instrument_code@instrument_version` | derivação | `null` quando não há comparabilidade única |
| `missing_reason` | motivo de ausência | todos | não programado / recusa / incapacidade / hospitalização / falha técnica / perda de seguimento / desconhecido | coleta futura | ainda não persistido; requerido para protocolo prospectivo |
| `sensory_modality` | modalidade sensorial | sensorial | vision / hearing | coleta/derivação futura | necessário para pesquisa; visão e audição não devem ser somadas |
| `clinical_event_id` | evento clínico | longitudinal | identificador do evento registrado | ClinicalProblem/ProblemEvent | opcional |
| `event_occurred_at` | data do evento | longitudinal | data real do evento | modelo futuro | não confundir com data de registro |
| `event_recorded_at` | data do registro | longitudinal | data em que o evento foi registrado no sistema | ProblemEvent.createdAt | obrigatório quando houver evento |
| `temporal_association` | associação temporal | longitudinal | evento ocorreu no mesmo intervalo entre avaliações | derivação futura | não implica causalidade |
| `causal_assertion` | causalidade | longitudinal | none / clinician-confirmed | declaração médica futura | default `none` |
| `derived_at` | data de derivação | domínio | data/hora de criação do estado derivado | persistência futura | obrigatório para materialização científica |

## Regras de missing

1. ausência de escore não é zero;
2. ausência de avaliação não é estabilidade;
3. valor demográfico necessário ausente não deve receber default clínico silencioso;
4. pesquisa prospectiva deve registrar o motivo do missing;
5. métodos estatísticos de imputação pertencem à análise científica, nunca à camada clínica do prontuário.

## Direção dos escores

A direção deve ser registrada por instrumento no catálogo científico (`higher-better`, `higher-worse` ou `non-numeric`). A UI nunca deve supor que aumento numérico significa melhora sem consultar a definição do instrumento e sua versão.

## Proveniência mínima de um ponto

`ponto -> domain_state -> metodologia/versão -> assessment_id -> instrumento/versão -> escore/classificação original -> consulta/data -> ScaleDefinition -> fonte científica`.

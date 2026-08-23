# Plano de validação científica — capacidade intrínseca e independência funcional

Status: protocolo de desenvolvimento metodológico. Não substitui aprovação ética nem cálculo amostral formal.

## 1. Pergunta principal proposta

Em idosos acompanhados ambulatorialmente, a trajetória longitudinal dos domínios de capacidade intrínseca está associada ao declínio subsequente da independência funcional?

## 2. Hipótese

Redução persistente ou declínio em um ou mais domínios de capacidade intrínseca estará associado a maior probabilidade de declínio posterior de AIVD/ABVD, mesmo após ajuste para idade, sexo, escolaridade, multimorbidade, fragilidade e eventos clínicos relevantes.

## 3. Desenho recomendado

Programa em duas fases:

### Fase 1 — estudo metodológico

Objetivos:

- validar conteúdo do mapeamento instrumento × domínio;
- testar reprodutibilidade computacional;
- avaliar concordância entre especialistas sobre o papel metodológico de cada instrumento;
- medir completude, missing e viabilidade clínica;
- avaliar validade convergente e discriminante dos estados por domínio;
- verificar se a classificação do software pode ser reproduzida a partir dos dados de origem e da versão metodológica.

### Fase 2 — coorte prospectiva longitudinal

População-alvo: idosos acompanhados longitudinalmente em ambulatório geriátrico, com bateria padronizada em baseline e seguimento.

Amostra definitiva deve ser calculada a partir do desfecho primário, efeito mínimo de interesse, variabilidade intraindividual, número de avaliações e perdas previstas. Para planejamento de viabilidade, uma coorte de algumas centenas de participantes com pelo menos três avaliações pode ser adequada para modelos longitudinais parcimoniosos; isto não é cálculo amostral definitivo.

## 4. Critérios de inclusão candidatos

- idade definida no protocolo prospectivo;
- acompanhamento ambulatorial com capacidade de completar pelo menos a bateria mínima ou ter motivo de missing documentado;
- consentimento conforme aprovação ética;
- baseline definido antes da análise.

## 5. Critérios de exclusão candidatos

Devem ser escolhidos para responder à pergunta clínica, evitando excluir sistematicamente os pacientes mais frágeis. Delirium, internação aguda ou incapacidade temporária de completar um teste devem preferencialmente gerar `missing_reason`/evento clínico e não exclusão automática, salvo se o protocolo exigir.

## 6. Bateria mínima candidata

A bateria deve permanecer estável entre visitas programadas.

| Dimensão | Instrumento candidato | Observação |
| --- | --- | --- |
| Independência funcional — AIVD | Lawton | candidato forte a desfecho funcional ambulatorial |
| Independência funcional — ABVD | Katz | desfecho funcional secundário |
| Locomoção | SPPB | âncora operacional |
| Cognição | escolher MoCA-BR **ou** MEEM como âncora principal | não alternar como se fossem a mesma escala |
| Psicológico | GDS-15 | rastreio de sintomas depressivos; versão/corte brasileiro a predefinir |
| Vitalidade | MNA-SF + variáveis adicionais em estudo | MNA-SF é proxy nutricional, não construto completo |
| Sensorial | visão + audição com método padronizado | definir instrumento, unidade, versão e cutoff antes do protocolo |

Instrumentos complementares podem ser coletados, mas não devem substituir silenciosamente a âncora longitudinal.

## 7. Baseline e frequência

Baseline = primeira visita em que a bateria protocolar mínima é realizada ou em que cada missing obrigatório recebe motivo documentado.

Uma agenda semestral por 18–24 meses é uma hipótese pragmática; a frequência final deve equilibrar responsividade dos instrumentos, carga clínica e viabilidade.

O tempo analítico deve ser medido em tempo real desde o baseline, e não apenas por número da consulta.

## 8. Definição de mudança

A análise deve preservar o escore original de cada instrumento.

Mudança categórica da UI é representação clínica e não deve substituir a análise dos escores originais.

Quando existir evidência de mudança clinicamente importante ou detectável para um instrumento/população, ela deve ser citada e pré-especificada. Não criar MCID local sem estudo.

Exemplo de evidência: para SPPB, estudos em idosos com limitações de mobilidade estimaram aproximadamente 0,5 ponto como pequena mudança significativa e 1,0 ponto como mudança substancial, mas esses valores são dependentes de população e contexto e não devem ser universalizados.

## 9. Covariáveis e confundidores candidatos

- idade;
- sexo;
- escolaridade;
- multimorbidade;
- carga medicamentosa relevante;
- fragilidade;
- depressão;
- déficit visual/auditivo;
- hospitalizações;
- AVC e outros eventos neurológicos;
- quedas e fraturas;
- delirium;
- situação social/cuidador;
- frequência e tempo entre avaliações.

A seleção final deve ser causalmente justificada e pré-especificada; evitar ajuste automático por todas as variáveis disponíveis.

## 10. Métodos estatísticos candidatos

### Desfechos contínuos repetidos

Modelos mistos são primeira opção quando a pergunta é trajetória de escore ao longo do tempo, permitindo tempos irregulares e correlação intraindividual.

### Desfecho ordinal/categórico

Modelo ordinal longitudinal/misto pode ser utilizado quando o desfecho primário for ordinal e suas premissas forem adequadas.

### Evento clínico

Análise de sobrevivência pode ser usada para tempo até nova dependência, hospitalização ou outro evento claramente definido.

### GEE

Pode ser alternativa quando o interesse principal for efeito médio populacional, e não trajetória individual.

### Classes latentes

Latent trajectory/class analysis deve ser exploratória e usada apenas com amostra e número de medições suficientes. Não deve ser escolhida por sofisticação.

## 11. Missing data

Não usar LOCF como regra clínica ou analítica padrão.

Registrar motivo do missing:

- não programado;
- recusa;
- impossibilidade física;
- hospitalização/agudização;
- déficit sensorial impeditivo;
- falha técnica;
- perda de seguimento;
- desconhecido.

Modelos mistos podem utilizar observações incompletas sob hipóteses específicas. Imputação múltipla e análises de sensibilidade devem ser consideradas quando adequadas, com pressupostos explicitados.

## 12. Propriedades de medida a avaliar

### Validade de conteúdo

Painel multiprofissional avalia se cada instrumento e papel metodológico representa o domínio proposto. Recomenda-se processo formal de consenso, com documentação de divergências.

### Validade convergente

Hipóteses prévias entre medidas relacionadas, por exemplo SPPB e velocidade de marcha.

### Validade discriminante

Demonstrar que domínios diferentes não são simplesmente a mesma variável recodificada.

### Confiabilidade

Interavaliador e teste-reteste quando aplicável ao instrumento e ao contexto.

### Responsividade

Avaliar capacidade de detectar mudança clínica relevante no tempo.

### Concordância

Avaliar concordância entre classificação do modelo e avaliação de referência previamente definida.

### Validade prognóstica

Testar se resultados/trajectórias por domínio predizem declínio funcional futuro.

## 13. Análises de sensibilidade

- excluir avaliações realizadas durante eventos agudos;
- restringir a mesma versão de instrumento;
- comparar definição categórica com escore contínuo original;
- testar diferentes janelas de tempo;
- avaliar impacto de perdas de seguimento;
- estratificar por escolaridade quando relevante para cognição;
- repetir análises excluindo proxies de vitalidade;
- comparar visão/audição separadamente em vez de resumo sensorial.

## 14. Riscos metodológicos prioritários

- viés de seleção;
- perda de seguimento diferencial;
- viés de informação/medição;
- prática/reteste em cognição;
- efeito teto/chão;
- confusão por eventos intercorrentes;
- mudança de instrumento ao longo do seguimento;
- missing não aleatório;
- uso de pontos de corte não validados na população;
- dupla contagem de construtos correlacionados;
- transformação indevida da visualização em um “escore”.

## 15. Critério de prontidão para pesquisa prospectiva

Antes de iniciar coleta prospectiva formal:

1. congelar a versão metodológica;
2. definir bateria obrigatória e versões;
3. definir métodos de visão e audição;
4. resolver o modelo de vitalidade no protocolo;
5. persistir `missing_reason`;
6. separar `eventOccurredAt` de `eventRecordedAt`;
7. persistir estados derivados/versionados ou garantir materialização reprodutível imutável;
8. aprovar dicionário de dados;
9. concluir revisão de licenciamento eletrônico dos instrumentos;
10. obter aprovação ética e plano estatístico pré-especificado.

# Oncogeriatria — arquitetura longitudinal v1

## Objetivo

Linha de cuidado adicional do Prontuário Aprimorado para avaliação geriátrica antes, durante e após tratamento oncológico.

Princípio de identidade:

**um paciente → um `Patient.id` → múltiplas linhas de cuidado → múltiplos episódios oncológicos quando necessário.**

O módulo não cria cadastro paralelo e não depende da participação no Programa 55+.

## Rotas

- `/oncogeriatria` — pacientes efetivamente em acompanhamento e busca do cadastro existente;
- `/patients/[id]/oncogeriatria` — resumo individual e episódios;
- `/patients/[id]/oncogeriatria/basal` — avaliação pré-tratamento;
- `/patients/[id]/oncogeriatria/tratamento` — cursos terapêuticos;
- `/patients/[id]/oncogeriatria/check` — Oncogeriatric Check e toxicidade;
- `/patients/[id]/oncogeriatria/intervencoes` — vulnerabilidades/intervenções;
- `/patients/[id]/oncogeriatria/longitudinal` — Δ geriátrico, timeline e gráficos;
- `/patients/[id]/oncogeriatria/pos-tratamento` — recuperação e seguimento;
- `/patients/[id]/oncogeriatria/relatorio` — resumo médico imprimível.

## Modelo longitudinal

### OncogeriatricEpisode

Um paciente pode possuir mais de um episódio oncológico ao longo da vida. O episódio guarda somente dados próprios da doença; identidade do paciente não é duplicada.

### OncogeriatricTreatmentCourse

Um episódio pode possuir múltiplos cursos/linhas. O esquema antineoplásico fica nesta trajetória e não é convertido em `Medication` crônica.

### OncogeriatricCheckpoint

Tipos suportados:

- PRE_TREATMENT;
- CYCLE;
- PERIODIC_REASSESSMENT;
- EVENT_DRIVEN;
- END_OF_TREATMENT;
- POST_3_MONTHS;
- POST_6_MONTHS;
- POST_12_MONTHS.

O vínculo com `Consultation` é opcional. Nenhuma consulta é criada apenas para satisfazer o módulo. Quando uma escala precisa ser persistida em `ScaleAssessment`, o checkpoint deve apontar explicitamente para uma consulta já existente.

### Intervenções, toxicidade e recuperação

Entidades próprias armazenam somente dados específicos da trajetória oncogeriátrica. `ClinicalProblem`, `Medication`, `ScaleAssessment` e demais domínios clínicos continuam sendo reutilizados quando semanticamente adequados.

## Escalas

`ScaleDefinition` e `ScaleAssessment` permanecem como registro único de instrumentos.

### G8

Versão eletrônica: `G8 / ORIGINAL_2012`.

Fonte principal: Bellera CA et al. *Annals of Oncology*. 2012;23(8):2166-2172. doi:10.1093/annonc/mdr587.

- faixa 0–17;
- cutoff tradicional <=14 para sinalização de vulnerabilidade;
- o resultado é rastreio, não decisão terapêutica.

### CARG

Versão eletrônica: `CARG / HURRIA_2011`.

Fonte principal: Hurria A et al. *Journal of Clinical Oncology*. 2011;29(25):3457-3465. doi:10.1200/JCO.2011.34.7625.

As 11 variáveis e pesos foram implementados em código de domínio testado. As categorias eletrônicas são:

- 0–5: baixo;
- 6–9: intermediário;
- >=10: alto.

A amostra original apresentou escores até 19; a soma teórica de todos os pesos é 23. O sistema preserva o escore calculado e usa a faixa >=10 como alta sem inventar recomendação de tratamento.

Mensagem obrigatória: **“Estimativa de risco para apoio à decisão clínica compartilhada.”**

Nenhuma PHI é enviada a calculadoras externas.

## Δ geriátrico

Séries são agrupadas por **código + versão**. Versões diferentes nunca são misturadas silenciosamente.

A visualização mostra baseline → atual e valor de Δ, mas não chama automaticamente uma mudança numérica de melhora/piora clinicamente significativa sem regra validada.

## Alertas

Alertas são informativos. Texto-base: **“Mudança clinicamente relevante identificada. Reavaliação médica indicada.”**

O sistema não pode emitir comandos como reduzir quimioterapia, suspender tratamento ou trocar esquema.

## Segurança

- autenticação obrigatória;
- escrita limitada a ADMIN/PHYSICIAN nesta versão, sem mudar RBAC global;
- patientId/episodeId/courseId/checkpointId validados no servidor;
- FKs compostas reforçam isolamento horizontal no banco;
- AuditEvent registra autoria/entidade/ação sem copiar conteúdo clínico;
- health não inclui PHI;
- nenhuma conta ou allowlist é alterada pelo módulo.

## Feature safety

`ONCOGERIATRIA_EMERGENCY_DISABLED=true` desabilita a entrada e as rotas próprias sem apagar dados e sem interferir no prontuário convencional.

## Health

`/api/health` expõe apenas:

- `oncogeriatria.enabled`;
- `oncogeriatria.schemaReady`;
- `oncogeriatria.version`.

## Relatório

O resumo oncogeriátrico é comunicação médica compacta. Copiar, imprimir e gerar snapshot exigem confirmação explícita de revisão clínica. O sistema de assinatura digital existente não é modificado.

## Rollback

As migrations são aditivas. Em rollback emergencial:

1. reimplantar o commit estável anterior ao módulo;
2. preservar as novas tabelas e seus dados;
3. não executar DROP;
4. manter o prontuário convencional e o Programa 55+ operacionais.

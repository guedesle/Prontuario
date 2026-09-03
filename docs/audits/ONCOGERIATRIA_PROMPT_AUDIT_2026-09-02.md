# Auditoria do Prompt Mestre — Oncogeriatria

Data: 2026-09-02
Baseline: `main` em `bf9c6acc9315a635e83d26892fe53c74e7fa2d10`
PR de implementação: #173
Release candidata: `2026-09-02-oncogeriatria-longitudinal-v1`

## Fase 0 — auditoria

- `AGENTS.md`: lido;
- skill clínica de frontend: lida;
- PR #172: confirmado merged na `main`;
- Programa 55+: usado como padrão arquitetural consolidado;
- `ConsultationType`: preservado;
- `ScaleDefinition` / `ScaleAssessment`: preservados como fonte única;
- health e smoke: auditados antes de modificação;
- migration 55+: confirmada aditiva.

## Conformidade por fase

| Fase | Estado no PR #173 | Observação |
| --- | --- | --- |
| 1 — arquitetura + schema | Implementada | Sete tabelas novas, migrations aditivas e FKs de identidade. |
| 2 — `/oncogeriatria` | Implementada | Lista apenas episódios iniciados; busca não faz enrollment. |
| 3 — Episode + TreatmentCourse | Implementada | Mesmo `Patient.id`, múltiplos episódios/cursos. |
| 4 — Baseline | Implementada | PRE_TREATMENT opcionalmente ligado à consulta existente. |
| 5 — G8 | Implementada + golden master | Domínio versionado; sem PHI externa; apoio à decisão. |
| 5B — CARG | Bloqueada por licença | Estrutura reservada, definição inativa e endpoint bloqueado até autorização formal. |
| 6 — Oncogeriatric Check | Implementada | Funcionalidade, mobilidade, nutrição, cognição e eventos. |
| 7 — Intervenções | Implementada | Registro manual/revisado pelo profissional. |
| 8 — Longitudinal + Δ | Implementada | Banco persistente; código+versão; timeline e gráficos. |
| 9 — Pós-tratamento | Implementada | Recovery map e checkpoints 3/6/12 meses programáveis. |
| 10 — Relatório | Implementada | Relatório oncogeriátrico específico, copiar, imprimir e snapshot com revisão clínica explícita. |
| 11 — segurança/performance | Implementada no código | CI e revisão do PR ainda são gates. |
| 12 — golden master/regressão | Em execução | CI do PR é obrigatório. |
| 13 — PR | Aberto como draft | #173. |
| 14 — deploy | Bloqueado até gates | Requer CI verde + ferramentas reais de hospedagem Hostinger e confirmação operacional. |

## Evidência científica e governança dos instrumentos

### G8

Bellera CA et al. Ann Oncol. 2012;23(8):2166-2172. doi:10.1093/annonc/mdr587.

A implementação segue oito componentes, faixa 0–17 e cutoff tradicional <=14 para sinalização de vulnerabilidade. Rótulos da interface são operacionais/parafraseados; a regra de pontuação está versionada e testada.

### CARG

Referência científica: Hurria A et al. J Clin Oncol. 2011;29(25):3457-3465. doi:10.1200/JCO.2011.34.7625.

Durante a revisão de fontes oficiais foi identificado copyright do CARG-TT e ausência de autorização pública inequívoca para incorporação eletrônica local em software próprio. Seguindo o gate de governança definido no prompt mestre, somente a implementação do CARG foi interrompida.

Nesta release:

- não há questionário CARG funcional;
- não há cálculo local CARG;
- `ScaleDefinition` `CARG / HURRIA_2011` fica inativa com `LICENSE_REVIEW_REQUIRED`;
- o endpoint `CARG_SAVE` responde com bloqueio explícito;
- nenhuma PHI é enviada a serviço externo;
- eventual resultado histórico já persistido pode ser exibido apenas como dado histórico.

A futura liberação deverá ocorrer em PR próprio após autorização formal, com termos de uso, versão/tradução autorizada, testes e revisão clínica documentados.

## Relatório final específico da Oncogeriatria

O relatório candidato consolida:

1. contexto oncológico e fase terapêutica;
2. G8;
3. status transparente do CARG pendente de licenciamento;
4. trajetória geriátrica baseline → atual sem misturar versões de escalas;
5. vulnerabilidades e recomendações geriátricas previamente registradas;
6. mudanças/sinais de atenção desde o último checkpoint;
7. toxicidades e eventos durante tratamento;
8. recuperação/pós-tratamento;
9. objetivo prioritário do paciente;
10. integração explícita com oncologia, sem decisão automática de dose/esquema.

Copiar, imprimir e gerar snapshot permanecem condicionados à revisão clínica explícita.

## Não regressão — estruturas não alteradas

- login Google / Better Auth;
- allowlist e usuários autorizados;
- `ConsultationType`;
- busca canônica de pacientes;
- identidade/homônimos;
- SOAP;
- exames;
- regras e pontos de corte das escalas geriátricas existentes;
- MEEM;
- Cornell;
- vacinas;
- medicamentos;
- lista de problemas;
- assinatura digital;
- gráficos geriátricos existentes;
- Programa 55+ e suas tabelas/rotas.

## Release gate

A entrega não é considerada concluída por build isolado. São obrigatórios:

1. migration em MySQL efêmero;
2. integração/isolamento de pacientes;
3. golden masters;
4. typecheck domínio;
5. typecheck completo;
6. build de produção;
7. audit de dependências;
8. deployment correto;
9. health da release exata;
10. smoke de login/rotas/persistência;
11. validação autenticada do fluxo oncogeriátrico.

## Hostinger

O deploy deve usar exclusivamente a infraestrutura de hospedagem já existente do Prontuário Aprimorado. Hostinger Horizons não é substituto aceitável para a aplicação Next.js/TypeScript/Prisma/MySQL existente. Nenhum deploy será improvisado por ferramenta incompatível, e o site principal `nataliamendesgeriatra.com` permanecerá intocado.

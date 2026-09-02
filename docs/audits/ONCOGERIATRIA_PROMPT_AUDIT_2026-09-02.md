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
| 5 — G8/CARG | Implementada + golden master | Domínio versionado; sem PHI externa; apoio à decisão. |
| 6 — Oncogeriatric Check | Implementada | Funcionalidade, mobilidade, nutrição, cognição e eventos. |
| 7 — Intervenções | Implementada | Registro manual/revisado pelo profissional. |
| 8 — Longitudinal + Δ | Implementada | Banco persistente; código+versão; timeline e gráficos. |
| 9 — Pós-tratamento | Implementada | Recovery map e checkpoints 3/6/12 meses programáveis. |
| 10 — Relatório | Implementada | A4, copiar, imprimir, snapshot com revisão clínica explícita. |
| 11 — segurança/performance | Implementada no código | CI e revisão do PR ainda são gates. |
| 12 — golden master/regressão | Em execução | CI do PR é obrigatório. |
| 13 — PR | Aberto como draft | #173. |
| 14 — deploy | Bloqueado | Requer CI verde + Hostinger hosting tools/confirmations. |

## Evidência científica usada para cálculo eletrônico

### G8

Bellera CA et al. Ann Oncol. 2012;23(8):2166-2172. doi:10.1093/annonc/mdr587.

A implementação segue oito componentes, faixa 0–17 e cutoff tradicional <=14 para sinalização de vulnerabilidade. Rótulos da interface são operacionais/parafraseados; a regra de pontuação está versionada e testada.

### CARG

Hurria A et al. J Clin Oncol. 2011;29(25):3457-3465. doi:10.1200/JCO.2011.34.7625.

A implementação usa as 11 variáveis/pesos descritos no modelo original. Categorias: 0–5, 6–9 e >=10. A amostra original alcançou 0–19; a soma teórica dos pesos é 23. O sistema não transforma o escore em decisão de tratamento.

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
8. Hostinger deployment correto;
9. health da release exata;
10. smoke de login/rotas/persistência;
11. validação autenticada do fluxo oncogeriátrico.

## Hostinger

Nesta sessão, o conector Hostinger expôs apenas ferramentas Horizons. Horizons não é apropriado ao projeto Next.js/TypeScript/Prisma/MySQL existente e não será usado como substituto do hosting MCP. Deploy permanece bloqueado até o conector de hospedagem real estar disponível e seus gates de confirmação serem cumpridos.

# Prontuário Aprimorado — scaffold de migração

Nova base para migração do protótipo `AGA 1.html` para um prontuário geriátrico longitudinal.

## Stack
- Next.js 16.2.11
- React 19.2
- TypeScript
- Prisma ORM 7
- MySQL/MariaDB

## Importante
**Não usar dados reais de pacientes neste scaffold ainda.**

A autenticação foi deliberadamente deixada em modo `fail-closed`: qualquer fluxo servidor que exija identidade profissional deve bloquear até a implementação do módulo de autenticação e autorização.

## Primeira execução

```bash
npm install
cp .env.example .env
# configurar DATABASE_URL
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

Se o Prisma solicitar reset de um banco que já contenha dados, não confirmar sem revisão.

## Ordem de implementação
1. autenticação e RBAC;
2. persistência Patient/Consultation;
3. isolamento de contexto paciente-consulta;
4. importação do legado para `legacy/AGA-1.html`;
5. extração e testes de ESCALAS;
6. extração e testes de INTERVENCOES;
7. lista longitudinal de problemas;
8. AGA inicial;
9. consulta subsequente;
10. documentos;
11. dashboard longitudinal.

## Documentos de engenharia
Veja `docs/` e `AGENTS.md`.
## Estado do golden master
A engine clínica/longitudinal possui atualmente **75 testes automatizados aprovados**. Veja `docs/VALIDACAO_GOLDEN_MASTER.md` e `docs/INVENTARIO_ESCALAS.md`.



## Estado atual da engine clínica
A migração já inclui escalas funcionais, cognitivas, humor, fragilidade/sarcopenia, suporte social, oncogeriatria e cuidados paliativos. A v4 acrescenta FAST, PPS, ESAS, Zarit institucional versionada e o primeiro motor longitudinal de comparação de escores.

### Motor longitudinal
`src/domain/longitudinal-scales.ts`:
- compara apenas mesmo paciente + instrumento + versão;
- conhece a direção do escore (maior=melhor ou maior=pior);
- calcula consulta atual × anterior e atual × baseline;
- devolve tendência favorável/estável/desfavorável sem afirmar significância clínica automática.


## Marco atual

O núcleo de domínio longitudinal está concluído para este estágio: comparação baseline/anterior/atual, herança de problemas ativos, propostas sujeitas a revisão médica, alertas clínicos separados, SOAP, relatório familiar, plano de medicamentos e snapshots versionados.

- `npm run validate:domain` executa os testes clínicos e o typecheck strict do domínio.
- `artifacts/demo-preview.html` demonstra o fluxo com dados inteiramente sintéticos.
- `.github/workflows/ci.yml` executará Prisma generate, testes, typecheck e build quando o projeto estiver no GitHub com acesso à internet.
- Dados reais permanecem proibidos até autenticação, banco, auditoria e homologação estarem concluídos.

Veja `docs/DEFINITION_OF_DONE.md` e `docs/STATUS_FINAL_MVP.md`.

## Estado v6 — segurança de produção

O núcleo clínico longitudinal permanece validado e a v6 acrescenta a camada de segurança/produção: Google OAuth com allowlist, RBAC, revogação de sessão, persistência fail-closed, finalização atômica, escaping HTML, backup cifrado e checklist de go-live.

Validação offline desta versão: **93/93 testes aprovados**, TypeScript strict do domínio aprovado e roundtrip cifrado de backup/restore aprovado.

**Ainda não usar dados reais** até concluir todos os itens P0 de `docs/GO_LIVE_CHECKLIST.md`, especialmente instalação das dependências, Prisma validate/generate/migrate, build Next.js, OAuth real, restore em MySQL de homologação e QA de impressão.

# Definition of Done — núcleo clínico longitudinal

## Marco considerado concluído nesta entrega

O **núcleo de domínio** é considerado concluído quando todos os itens abaixo estão atendidos:

- [x] regras clínicas do golden master extraídas para funções puras;
- [x] escalas migradas possuem testes de borda;
- [x] Zarit institucional de 7 itens versionada sem preencher a lacuna documental do escore 22;
- [x] procedência científica/local separada do cálculo;
- [x] alertas clínicos separados das orientações à família;
- [x] comparação atual × anterior × baseline;
- [x] versões diferentes da mesma escala não são comparadas silenciosamente;
- [x] tendências são descritas como numéricas, sem inferir significância clínica automática;
- [x] problemas ativos são herdados na consulta subsequente;
- [x] problemas derivados de escalas entram apenas como **propostas para revisão**;
- [x] problemas resolvidos permanecem no histórico e não são herdados como ativos;
- [x] SOAP tem S/O/A/P e não promove propostas não confirmadas;
- [x] relatório familiar separa problemas clínicos e geriátricos;
- [x] tabela/plano de medicamentos é agrupável por horário;
- [x] documentos possuem mecanismo de versionamento de snapshot;
- [x] contexto paciente ↔ consulta ↔ documento falha fechado em divergências;
- [x] caso sintético end-to-end gera SOAP, relatório familiar e plano de medicamentos;
- [x] suíte clínica completa passa;
- [x] TypeScript `strict` passa no domínio;
- [x] CI foi configurado para repetir testes, Prisma generate, typecheck e build no GitHub.

## Fora deste marco — depende de infraestrutura/credenciais

Estes itens são necessários antes de uso clínico real, mas não podem ser concluídos apenas no domínio offline:

- [ ] instalar dependências NPM no ambiente de deploy;
- [ ] executar `prisma generate` e primeira migration em banco MySQL de desenvolvimento;
- [ ] implementar autenticação real e RBAC com credenciais do ambiente;
- [ ] configurar secrets de produção;
- [ ] executar build Next.js de produção;
- [ ] deploy no domínio de produção;
- [ ] QA manual no navegador e impressão A4;
- [ ] testes com dados **sintéticos** em ambiente de homologação;
- [ ] revisão clínica final antes de aceitar dados reais.

## Bloqueios encontrados no sandbox desta rodada

1. O registro npm global do ambiente está configurado com URL inválida (`https:///`).
2. Mesmo sobrescrevendo o registry, o sandbox não resolve DNS para `registry.npmjs.org`.
3. O sandbox também não resolve `github.com`, portanto não é possível `git push` por CLI.
4. O conector GitHub disponível lê o repositório, mas operações de escrita retornam `403 Resource not accessible by integration`.

Esses bloqueios são de infraestrutura externa ao código. A validação independente de dependências (`node --experimental-strip-types` + `tsc`) foi executada com sucesso.


## Marco de segurança de produção — v6
- [x] política RBAC definida e testada;
- [x] allowlist de e-mails fail-closed;
- [x] bootstrap do primeiro administrador;
- [x] proteção do último administrador ativo;
- [x] consulta finalizada imutável no domínio;
- [x] finalização exige revisão e ausência de alerta urgente pendente;
- [x] escaping HTML testado;
- [x] auditoria operacional sem duplicação de conteúdo clínico livre;
- [x] scripts de backup cifrado e restore com dupla confirmação;
- [x] rota de health check;
- [x] configuração Better Auth/Google OAuth adicionada;
- [x] tokens OAuth configurados para criptografia;
- [x] account linking desabilitado;
- [x] rate limiting configurado em banco;
- [x] revogação de sessão ao desativar/alterar privilégio;
- [x] checklist de go-live documentado;
- [x] CI recebe variáveis sintéticas seguras para validar build.

### Ainda exige ambiente conectado
- [ ] instalar Better Auth/Prisma/Next e gerar lockfile;
- [ ] validar schema com `prisma format`/`prisma validate`;
- [ ] executar migration em MySQL de homologação;
- [ ] executar build real;
- [ ] criar credenciais Google OAuth reais;
- [ ] testar restore real;
- [ ] homologar navegador/impressão;
- [ ] completar todos os P0 do checklist de go-live.

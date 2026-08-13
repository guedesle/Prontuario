# Validação v6 — segurança e produção

Data: 2026-08-13

## Resultado executado nesta sessão
- 93/93 testes de domínio aprovados;
- TypeScript `strict` do domínio aprovado;
- roundtrip de backup/restore cifrado aprovado;
- varredura do repositório: 92 arquivos rastreados, nenhuma violação detectada;
- `git diff --check` aprovado;
- sintaxe Node dos scripts e módulos servidor `.ts` verificada;
- busca por `dangerouslySetInnerHTML`, `innerHTML=`, `eval` e `new Function` sem ocorrências.

## Hardening incluído
- Google OAuth + allowlist;
- RBAC ADMIN/PHYSICIAN/READ_ONLY;
- bootstrap do primeiro ADMIN;
- proteção do último administrador ativo;
- revogação de sessões após mudança de acesso;
- sessão de 8h e ação administrativa com autenticação recente;
- OAuth token encryption;
- account linking desabilitado;
- rate limiting em banco;
- workflow de consulta DRAFT -> IN_REVIEW -> FINALIZED;
- finalização bloqueada por alerta urgente não revisado;
- persistência deriva paciente da consulta no servidor;
- escaping HTML;
- auditoria sem conteúdo clínico livre;
- backup AES-256-GCM + SHA-256;
- restore com dupla confirmação em produção;
- health check;
- CI e checklist de go-live.

## Bloqueio externo restante
A tentativa de `npm install --registry=https://registry.npmjs.org` expirou no sandbox. Portanto, ainda não foi possível executar nesta máquina:
- `prisma validate`;
- `prisma generate`;
- full `npm run typecheck`;
- `next build`;
- migration MySQL real.

Esses passos permanecem obrigatórios no CI/ambiente conectado antes do uso clínico.

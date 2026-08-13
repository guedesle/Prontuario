# Autenticação e autorização

## Decisão
O MVP de produção utiliza **Google OAuth** por Better Auth, com uma **allowlist explícita de e-mails**. Não existe cadastro público e não existe senha local no prontuário.

## Fluxo
1. usuário escolhe “Entrar com Google”;
2. Google autentica a identidade;
3. Better Auth processa o callback;
4. antes de criar o usuário, a aplicação verifica `AUTH_ALLOWED_EMAILS`;
5. usuário fora da lista é recusado;
6. o primeiro administrador é definido por `AUTH_BOOTSTRAP_ADMIN_EMAILS`;
7. a cada nova sessão, a aplicação verifica novamente se o usuário está ativo e continua na allowlist;
8. endpoints clínicos consultam o usuário no banco antes de autorizar a ação.

## RBAC
### ADMIN
- leitura e escrita clínica;
- finalização de consulta;
- geração de documentos;
- gestão de usuários;
- consulta de auditoria operacional.

### PHYSICIAN
- leitura e escrita clínica;
- finalização de consulta;
- geração de documentos;
- sem gestão de usuários.

### READ_ONLY
- somente leitura de pacientes autorizados;
- sem alteração de consulta/documento/usuário.

## Sessão
- validade máxima configurada: 8 horas;
- refresh: 30 minutos;
- cookie cache desativado para não atrasar revogação;
- cookies seguros em produção;
- gestão de usuários exige autenticação recente (10 minutos);
- mudança de papel ou desativação revoga todas as sessões daquele usuário.

## OAuth
- tokens de acesso/refresh são armazenados com criptografia habilitada pelo Better Auth;
- account linking está desabilitado;
- somente o provedor Google está habilitado no MVP;
- scopes adicionais não devem ser solicitados sem necessidade clínica/operacional documentada.

## Google Cloud
Configurar exatamente os redirects dos ambientes usados. Exemplo de produção:

`https://prontuario.nataliamendesgeriatra.com/api/auth/callback/google`

Não usar wildcard para callback.

## Primeiro administrador
`AUTH_BOOTSTRAP_ADMIN_EMAILS` precisa ser subconjunto de `AUTH_ALLOWED_EMAILS`.

Depois do primeiro login, a gestão de usuários deve ser feita pelo fluxo administrativo. A aplicação impede desativar/rebaixar o último administrador ativo.

## Remoção de acesso
1. desativar usuário;
2. remover e-mail da allowlist de produção;
3. revogar sessões;
4. registrar evento de auditoria;
5. se necessário, revogar o aplicativo no provedor Google.

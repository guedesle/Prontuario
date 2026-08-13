# Segurança e dados clínicos

## Repositório público
Este repositório é de código e documentação técnica. **Dados reais de pacientes são proibidos.**

Nunca commitar:
- nome, data de nascimento, telefone ou endereço de paciente;
- prontuários exportados;
- arquivos JSON de consultas;
- relatórios, receitas ou tabelas de medicamentos reais;
- exames, imagens ou PDFs clínicos;
- credenciais, tokens, senhas ou `.env`;
- backups de banco de dados.

## Dados de teste
Usar apenas fixtures sintéticas, claramente fictícias, sem copiar combinações identificáveis de pacientes reais.

## Produção
A aplicação clínica deve manter dados fora do Git, em banco protegido, com autenticação, autorização, auditoria e política de backup/restauração.

## Fail closed
Enquanto autenticação e autorização não estiverem concluídas, endpoints clínicos devem bloquear acesso em vez de assumir usuário padrão.

## Incidente
Se dado clínico real for commitado:
1. interromper novas publicações;
2. remover o dado do histórico Git, não apenas do commit mais recente;
3. rotacionar qualquer credencial exposta;
4. avaliar impacto e medidas de resposta conforme a política institucional aplicável.


## Autenticação do MVP
- Google OAuth com lista fechada de e-mails;
- RBAC `ADMIN` / `PHYSICIAN` / `READ_ONLY`;
- tokens OAuth criptografados no armazenamento;
- account linking desabilitado;
- cookie cache de sessão desabilitado para permitir revogação imediata;
- rate limiting persistido no banco;
- alteração administrativa exige sessão recente.

## Renderização
Saídas clínicas são geradas como texto estruturado. Qualquer renderer HTML deve escapar conteúdo dinâmico. O projeto fornece `escapeHtml`/`textToSafeHtml` e testes contra injeção.

## Headers
O Next.js envia `nosniff`, bloqueio de iframe, `no-referrer` e restrições de Permissions-Policy. CSP será ativada somente após teste com nonce no build real, para evitar política aparente que quebre hidratação ou induza exceções inseguras.

## Backup
Backups via script são comprimidos e cifrados em AES-256-GCM e acompanhados de SHA-256. A chave fica fora do Git e fora do arquivo de backup.

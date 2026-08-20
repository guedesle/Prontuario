# Confirmação explícita antes de alterar status de problema

## Contexto

A lista longitudinal de problemas já bloqueava alterações retrospectivas e consultas finalizadas, mas a interface permitia registrar uma mudança de status com um único clique após selecionar o novo estado.

## Alteração

A interface agora exige uma confirmação explícita de revisão clínica antes de enviar qualquer mudança entre `ACTIVE`, `STABLE`, `MONITORING` e `RESOLVED`.

- selecionar um novo status invalida qualquer confirmação anterior;
- status idêntico ao atual não gera ação redundante;
- consulta histórica, consulta finalizada ou gravação em andamento continuam bloqueadas;
- a confirmação é limpa após gravação bem-sucedida;
- nenhuma transição de status é automatizada ou inferida.

A regra de habilitação foi isolada em `src/domain/problem-status-review.ts` e protegida por golden masters.

## Segurança clínica

A mudança é exclusivamente um guard de UX para exigir intenção explícita. Não altera título, descrição, classificação clínico/geriátrico, semântica de status, histórico de `ProblemEvent` nem regras server-side já existentes.

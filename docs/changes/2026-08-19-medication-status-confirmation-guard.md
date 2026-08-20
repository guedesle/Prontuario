# Confirmação clínica explícita para mudança de status de medicamento

Data: 2026-08-19

## Contexto

O workspace de reconciliação medicamentosa já restringe alterações à consulta mais recente não finalizada e mantém `patientId`, consulta e estado anterior sob controle do servidor. A interface, porém, permitia enviar uma mudança de status após selecionar o novo estado e clicar no botão, sem uma confirmação separada de revisão clínica.

## Alteração

- mudanças de `ACTIVE`, `SUSPENDED` e `FINISHED` passam a exigir uma confirmação explícita de que o status foi revisado clinicamente;
- trocar a opção de status desmarca a confirmação, evitando reaproveitar uma confirmação feita para outra escolha;
- após gravação bem-sucedida, escolha e confirmação locais são limpas antes de recarregar o estado derivado do servidor;
- a regra de habilitação foi centralizada no domínio e coberta por golden master;
- para status já presente no histórico explícito, confirmar o mesmo estado continua não gerando evento redundante;
- para o primeiro evento explícito de um medicamento cujo estado atual vem apenas do registro corrente, a confirmação permite registrar o estado revisado sem inferir retrospectivamente o passado.

## Segurança clínica

Nenhuma medicação, dose, via, frequência, horário, indicação ou regra terapêutica foi criada ou alterada. A mudança adiciona fricção deliberada apenas à gravação de estado medicamentoso e preserva os gates server-side existentes.

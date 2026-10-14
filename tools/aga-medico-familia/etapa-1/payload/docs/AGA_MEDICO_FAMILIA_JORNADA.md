# AGA — Médico da Família | Jornada de avaliação e cuidado compartilhado

Estado: interface demonstrativa inicial. Não habilitada para uso clínico, triagem ou encaminhamento.

## Objetivo
Adicionar uma linha de cuidado ao Prontuário Aprimorado sem substituir o módulo geriátrico. O médico da família coleta informações durante atendimento habitual, aplica **cinco escalas que ainda serão selecionadas e validadas** e revisa os achados. Quando apropriado, a avaliação é discutida com o geriatra, preservando a decisão clínica profissional.

## Experiência de navegação
- `/login`: apresentação visual e acesso social Google existente; campos de e-mail/senha desabilitados até provisionamento seguro.
- `/modulos`: seleção entre Prontuário Geriátrico (atual) e AGA — Médico da Família (novo).
- `/aga-medico-familia`: protótipo sem dados clínicos, com seis etapas e barra de progresso.
- Login com Google passa a retornar para `/modulos`.

## Jornada prevista
1. Identificação e contexto do paciente.
2. Coleta clínica feita pelo médico da família.
3. Registro das cinco escalas pré-selecionadas, com instrumento/versão/data/responsável.
4. Revisão de achados e possíveis sinais de alerta — sem previsão de internação inferida automaticamente.
5. Avaliação conjunta médico da família/geriatra quando indicada, registrando encaminhamento, discussão e recomendações.
6. Síntese, decisão clínica documentada, comunicação ao paciente e continuidade assistencial.

## Progresso ≠ risco
A barra acompanha completude operacional, não gravidade. Na demonstração, 5 itens representam etapas diferentes das escalas e 5 itens representam os instrumentos; total 10. A etapa de escalas só fica visualmente concluída quando os cinco slots estiverem marcados.

Na implementação clínica, progresso deve ser calculado a partir de **dados efetivamente persistidos**, com identidade da consulta e do paciente, status de rascunho, revisão e autoria. Concluir 100% do preenchimento nunca deverá liberar automaticamente uma conduta ou documento.

## Requisitos para desenvolvimento clínico
- Definir e validar as cinco escalas, versões, licenças, pontos de corte, idioma e viabilidade para APS.
- Distinguir alerta que requer ação imediata de achado que pode ser discutido em fluxo eletivo. Não adiar assistência urgente por causa do preenchimento ou de interconsulta.
- Registrar ciência e decisão do médico da família; geriatra participa conforme processo pactuado, com controle de acesso e trilha de auditoria.
- Definir evidências mínimas para compartilhamento de caso, consentimento quando aplicável e restrição do acesso ao paciente/consulta.
- Não duplicar cadastro de pacientes nem alterar o histórico geriátrico legado.
- Documentar o fluxo de encaminhamento e o retorno de recomendações ao profissional solicitante.
- Fazer testes de isolamento paciente-consulta, concorrência, ausência de dados, status rascunho/revisado, salvamento e risco de confusão entre casos.
- Manter dados sintéticos até homologação clínica, privacidade e segurança.

## Limites da primeira etapa
A nova rota ainda não faz CRUD nem vincula paciente real. Checkbox não grava no banco, não calcula escala, não infere risco ou encaminha casos. Dados da demonstração somem ao recarregar. E-mail/senha não possui autenticação ativa; Google OAuth continua sendo a entrada operacional.

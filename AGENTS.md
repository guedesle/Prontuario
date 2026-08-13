# AGENTS.md — Prontuário Aprimorado

## Regra principal
Este é um sistema de apoio à decisão clínica geriátrica. Segurança clínica, rastreabilidade e preservação de dados têm prioridade sobre velocidade de implementação.

## Restrições obrigatórias
1. Nunca inventar informação clínica ausente.
2. Nunca misturar dados de pacientes ou consultas.
3. Nenhum documento pode ser gerado sem `patientId` e `consultationId`.
4. Não alterar ponto de corte, interpretação de escala ou regra clínica sem:
   - fonte/documentação;
   - revisão clínica;
   - teste automatizado.
5. Não apagar histórico clínico para "simplificar" a interface.
6. Problemas resolvidos devem permanecer no histórico.
7. Toda geração de documento deve produzir snapshot versionado.
8. Não acoplar regra clínica diretamente a componente React.
9. As regras extraídas do legado devem inicialmente reproduzir o comportamento do `AGA 1.html` antes de serem aprimoradas.
10. A médica mantém a decisão clínica final. Sugestões automáticas são editáveis e nunca são aplicadas silenciosamente.

## Fluxo clínico
`Paciente -> AGA inicial -> Problemas longitudinais -> Consultas subsequentes -> Evolução -> Plano -> Saídas`

## Saídas
- SOAP técnico para prontuário;
- lista longitudinal de problemas;
- relatório acessível para família/cuidadores;
- tabela de medicamentos.

## Linguagem
### SOAP
Técnica, objetiva, sem orientação leiga.

### Família/cuidadores
Acessível, prática, sem jargão desnecessário e sem substituir decisão médica.

## Qualidade mínima por mudança
Antes de considerar uma mudança clínica concluída:
- teste de isolamento de paciente;
- teste de persistência;
- teste de cenário sem dados;
- teste de regressão da regra clínica;
- verificação do impacto no SOAP;
- verificação do impacto no relatório da família;
- verificação do impacto na tabela de medicamentos, se aplicável.

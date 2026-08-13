# Estado do MVP técnico

## Resultado

A base saiu de um HTML monolítico para um domínio TypeScript testável, longitudinal e orientado à segurança clínica.

### Fluxo implementado no domínio

`Paciente → AGA/baseline → problemas ativos → consulta subsequente → escalas atuais → comparação longitudinal → alertas → propostas de problemas → intervenções → SOAP / família / medicamentos → snapshot versionado`

### Regras de segurança já implementadas

- não misturar pacientes;
- não misturar versões de escala;
- não promover sugestão para problema ativo sem confirmação;
- não esconder CAM positivo;
- não esconder sintoma ESAS >=7 atrás da soma global;
- não inventar classificação do Zarit institucional em 22;
- preservar histórico de problemas resolvidos;
- versionar documentos por consulta/tipo;
- falhar fechado quando paciente/consulta/documento divergem.

### Validação atual

- 75 testes automatizados aprovados;
- 0 falhas;
- TypeScript strict aprovado para `src/domain/**/*.ts`;
- demonstração sintética gerada em `artifacts/demo-preview.html`.

### Próxima fronteira

A próxima fronteira não é mais uma regra clínica de domínio: é infraestrutura de aplicação — dependências, Prisma/MySQL, autenticação, persistência e deploy. Por segurança, o scaffold continua proibido para dados reais até esses itens serem implementados e validados.

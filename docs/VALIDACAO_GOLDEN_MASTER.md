# Validação do Golden Master

## Marco atual
A engine clínica extraída do `AGA 1.html` possui **45 testes automatizados** no diretório `tests/golden-master`.

Última validação desta versão:
- 45 testes executados;
- 45 aprovados;
- 0 falhas;
- tipagem TypeScript dos módulos de domínio aprovada em checagem isolada;
- checagem full-stack depende da instalação das dependências Next/React/Prisma (`npm install`).

## Instrumentos com teste automatizado
- Katz;
- Lawton;
- Barthel;
- Pfeffer;
- GDS-15;
- Cornell;
- CAM;
- MoCA;
- MEEM;
- 10-CS;
- FRAIL-BR;
- SARC-F;
- força de preensão;
- velocidade de marcha em 4 m;
- sentar-levantar 5x;
- SPPB;
- antropometria;
- KPS;
- LACE;
- STOPPFall;
- polifarmácia;
- G8;
- APGAR familiar;
- Zarit reduzida;
- Charlson;
- VES-13;
- MNA-SF.

## Intervenções com testes
- Lawton;
- Pfeffer;
- Barthel;
- G8;
- polifarmácia;
- SARC-F;
- composição/deduplicação de plano;
- APGAR familiar;
- Zarit reduzida;
- Charlson;
- VES-13;
- MNA-SF.

## Alertas clínicos com testes
- GDS-15: lembrete persistente para pesquisa ativa de ideação suicida;
- Cornell: item co16 sempre revisado e alerta urgente quando positivo;
- CAM positivo: alerta urgente de delirium provável.

## Limite desta validação
Estes testes comprovam equivalência das regras **já extraídas** do legado. Eles não significam que toda a AGA foi migrada nem que o scaffold esteja autorizado para dados reais de pacientes.

Antes de produção ainda são P0:
- autenticação;
- autorização por perfil;
- persistência confiável;
- isolamento paciente/consulta;
- auditoria;
- migração de dados;
- QA de documentos e impressão.


## Marco v4
- Suíte atual: **56/56 testes aprovados**.
- Zarit institucional de 7 itens adicionada como versão separada do legado, com falha explícita no escore 22 por lacuna documental.
- FAST / PPS / ESAS migrados do golden master.
- ESAS passa a expor sintomas individuais >=7 além do escore total.
- Motor longitudinal criado com comparação por `scaleCode + scaleVersion`, direção da escala e bloqueio de versões diferentes.

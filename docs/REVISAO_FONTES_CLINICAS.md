# Revisão de procedência clínica

## Objetivo
A migração tem dois requisitos independentes:

1. **equivalência com o golden master** (`AGA 1.html`);
2. **procedência clínica verificável** para escalas, pontos de corte e textos interpretativos.

Reproduzir uma regra do legado não significa automaticamente que a referência bibliográfica citada por ele esteja correta. Por isso, a aplicação passa a registrar o status de procedência em `src/domain/clinical-config/source-provenance.ts`.

## APGAR familiar
O instrumento Family APGAR foi proposto por Smilkstein em 1978 e teve estudos posteriores de validade/confiabilidade. A configuração atual do legado usa:
- 0–3: disfunção acentuada;
- 4–6: disfunção moderada;
- 7–10: boa funcionalidade.

Há uma discrepância interna no material do projeto: o formulário AGA/SBGG disponível registra `< 3`, `4–6` e `> 6`, enquanto o `AGA 1.html` registra `0–3`, `4–6` e `7–10`.

**Decisão de migração:** reproduzir o `AGA 1.html` para equivalência, mas manter a classificação como `mixed-primary-and-local` até revisão clínica explícita.

## Zarit reduzida — revisão prioritária
O legado possui uma escala de sete itens, 0–28 pontos, com faixas:
- 0–10: leve/ausente;
- 11–16: moderada;
- 17–28: intensa.

Porém, a referência citada no próprio legado — Bédard et al., 2001 — descreve uma versão curta de **12 itens** e uma versão de rastreio de **4 itens**.

**Decisão de migração:** preservar os sete itens e suas faixas apenas como golden master, sem rotular esta versão como “validada por Bédard 2001”. Antes da produção, identificar a origem da versão de sete itens ou substituí-la por instrumento/versionamento bibliograficamente definido após decisão clínica.

**Status:** `needs-review`.

## Charlson
O índice combinado com ajuste de idade tem sustentação no trabalho de Charlson e colaboradores. O legado soma pesos de condições e acrescenta até quatro pontos por idade.

As cores/faixas usadas pelo aplicativo (`0–2`, `3–4`, `>=5`) devem ser entendidas como **regra local de apresentação e priorização**, não como categorias de mortalidade individual validadas pelo artigo.

**Status:** `mixed-primary-and-local`.

## VES-13
O legado utiliza os quatro blocos ponderados do VES-13 (idade, saúde autorreferida, dificuldades físicas e dependência funcional) e classifica como vulnerável em `>=3`.

Essa regra é coerente com o estudo original de Saliba et al., no qual o escore `>=3` identifica o grupo vulnerável.

**Status:** `confirmed-primary`.

## MNA-SF
A MNA-SF revisada usa seis itens e permite substituir IMC por circunferência da panturrilha quando o IMC não pode ser calculado.

A nova engine torna essa regra explícita:
- se o IMC estiver disponível, ele é usado;
- a panturrilha só é usada como substituta;
- ausência de ambos impede a classificação e retorna estado cinza, em vez de inventar pontuação.

**Status:** `confirmed-primary`.

## Zarit institucional de 7 itens — Atenção Domiciliar / Cuidados Paliativos
O PDF institucional anexado ao projeto descreve sete perguntas, cada uma pontuada de 1 a 5. O total possível é 7–35. O próprio material apresenta:
- até 14: leve;
- 15–21: moderada;
- acima de 22: grave.

O valor **22 não recebe categoria explícita no material**. A aplicação não corrige isso silenciosamente: `score=22` retorna estado cinza e exige revisão. Essa versão é registrada como `zarit_paliativo_7_ms2013`, separada da `zarit_reduzida` do golden master.

**Status:** `confirmed-institutional` para a regra documental; validação psicométrica/origem da versão de sete itens permanece uma questão distinta.

## FAST
O legado contém FAST ordinal até 7f e agrupa a apresentação em 1–2, 3, 4, 5, 6 e 7. A escala é migrada preservando os valores discretos e impedindo números que não correspondem a estágio configurado.

As cores e textos de intervenção são camada local do prontuário, não parte do escore FAST.

**Status:** `mixed-primary-and-local`.

## PPS
O legado registra níveis de 10% a 100% e usa as faixas 70–100, 40–60 e 10–30 para apresentação clínica. A aplicação mantém uma advertência: PPS descreve desempenho funcional no momento e não deve ser comunicado como previsão individual de tempo de vida.

**Status:** `mixed-primary-and-local`.

## ESAS
O legado usa nove sintomas de 0 a 10, soma total 0–90 e uma regra adicional: qualquer sintoma com nota >=7 deve ser destacado independentemente da soma. A nova engine retorna ambos: carga global e lista de sintomas intensos.

As faixas globais e o limiar de ação são identificados como regras do aplicativo até auditoria bibliográfica específica da versão brasileira utilizada.

**Status:** `mixed-primary-and-local`.

## Clinical Frailty Scale (CFS)
Não foi localizada uma definição operacional da CFS dentro do `AGA 1.html` usado como golden master. Portanto ela **não será criada como se já fizesse parte do legado**. A inclusão futura deverá ter versão, material de aplicação e procedência definidos antes de entrar em produção.

## ECOG Performance Status

Os graus discretos 0–5 seguem a definição pública da ECOG-ACRIN e a publicação de Oken et al. (1982; PMID 7165009). A apresentação em português acompanha o conteúdo fornecido para revisão. As cores da interface são auxiliares locais e não fazem parte da escala.

**Status:** `confirmed-primary`.

## CRASH adaptada — MNA-SF

A CRASH original de Extermann et al. (Cancer. 2012;118:3377–3386; PMID 22072065) utiliza Chemotox, pressão diastólica, AIVD, LDH, ECOG, MEEM e MNA completo, mantendo subescores hematológico e não hematológico.

Por decisão clínica explícita registrada em 2026-08-13, esta aplicação criou uma versão institucional separada, `CRASH-MNA-SF-local-1.0`. Ela substitui apenas o componente MNA completo por:

- MNA-SF 12–14: 0 ponto;
- MNA-SF 0–11: 2 pontos.

MEEM, ECOG e MNA-SF podem ser preenchidos a partir da avaliação mais recente do mesmo paciente, sempre com data e confirmação visíveis. AIVD não é preenchida pela escala de Lawton 7–21, pois as faixas não são intercambiáveis.

Essa adaptação não possui validação externa, não deve ser rotulada como equivalente à CRASH original e não pode ser usada isoladamente para decidir tratamento oncológico.

**Status:** `needs-review`.

## Governança
Antes de disponibilizar uma escala em produção, exigir:
- versão identificada;
- referência rastreável;
- regra de pontuação testada;
- pontos de corte documentados;
- status de procedência diferente de `needs-review`, salvo liberação clínica explícita e registrada.

## Registro v7

A v7 não modificou pontos de corte, classificações ou referências. O novo catálogo tipado apenas reúne os metadados usados pelo relatório AGA. Ausência de referência no catálogo continua visível como `needs-review` e não é preenchida por inferência.

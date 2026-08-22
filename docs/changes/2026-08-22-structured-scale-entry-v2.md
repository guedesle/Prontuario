# Escalas clínicas — preenchimento estruturado v2

## Objetivo

Alinhar o preenchimento das escalas ao padrão clínico aprovado na interface: alternativas selecionáveis e ausência de campo numérico livre para escores discretos.

## Regra de interface

- Escalas que já possuem itens estruturados continuam exibindo as alternativas do instrumento e calculando o resultado no servidor.
- Escalas complementares que armazenam somente um escore discreto passam a expor os valores permitidos como lista de seleção, preservando o mesmo algoritmo clínico e as mesmas faixas de interpretação.
- MEEM, MoCA e ISI permanecem como registros rápidos score-only, sem reprodução dos itens protegidos.
- Força de preensão, velocidade de marcha e sentar-levantar 5 vezes permanecem como medidas numéricas contínuas, pois kg, m/s e segundos são o próprio dado clínico longitudinal e não um escore discreto.

## Segurança clínica

A alteração é somente de apresentação/entrada. O valor persistido e os algoritmos de classificação não foram redefinidos. Nenhum resultado cria diagnóstico ou conduta automaticamente.

## Escalas diretamente beneficiadas

Inclui, entre outras, Barthel, Cornell, FRAIL-BR, SARC-F, polifarmácia, STOPPFall, LACE, G8, VES-13, MNA-SF, Charlson e ESAS. FAST, PPS, KPS, CAM e o 10-CS estruturado já utilizavam alternativas discretas.

## Release

`2026-08-22-scales-structured-entry-v2`

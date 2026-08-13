# Estratégia de migração do AGA 1.html

## Estado atual identificado
O legado concentra em um único arquivo:
- HTML;
- CSS;
- estado em JavaScript;
- configuração das escalas;
- interpretações e intervenções;
- cálculo;
- relatório para família;
- resumo para prontuário;
- tabela/receita de medicamentos;
- salvamento/abertura manual em JSON.

Isso é útil como protótipo funcional, mas não deve ser convertido diretamente em componentes React sem uma etapa intermediária.

## Princípio de migração
**Preservar comportamento antes de melhorar comportamento.**

### Etapa 1 — Congelar o legado
Copiar o arquivo atualmente validado para:

`legacy/AGA-1.html`

Não editar esse arquivo após iniciar os testes de equivalência. Mudanças futuras ocorrem na nova aplicação.

### Etapa 2 — Extrair configuração clínica
Separar do HTML:
- `ESCALAS`;
- `INTERVENCOES`;
- listas de alertas;
- fontes/referências;
- regras de inclusão em documentos.

Destino sugerido:

```
src/domain/clinical-config/
  scales/
  interventions/
  references/
```

Cada configuração recebe `code`, `version` e data de revisão.

### Etapa 3 — Extrair funções puras
Prioridade de extração:
1. cálculo das escalas;
2. classificação/semaforização;
3. construção da lista de problemas;
4. construção do plano;
5. interpretação resumida;
6. análise das medicações;
7. regras de geração das saídas.

Uma função de domínio não deve acessar `document`, `window`, DOM ou componente React.

### Etapa 4 — Golden master tests
Criar casos representativos e executar os mesmos dados:
- no legado;
- na nova função TypeScript.

Comparar:
- escore;
- classe;
- cor;
- problema gerado;
- intervenção gerada.

Somente após equivalência, autorizar refatoração da regra.

## Casos mínimos para golden master
- paciente sem escala aplicada;
- todas escalas preservadas;
- uma escala limítrofe;
- múltiplas escalas alteradas;
- problema manual + síndrome geriátrica automática;
- problema resolvido/inativo;
- polifarmácia com Beers positivo;
- medicação temporária;
- medicação contínua;
- dados incompletos;
- troca de paciente durante sessão.

## Etapa 5 — Persistência
Substituir download de `.json` como mecanismo primário por:
- banco de dados;
- autosave controlado;
- rascunho/finalização;
- recuperação de sessão.

O `.json` poderá existir apenas como exportação administrativa, nunca como banco oficial.

## Etapa 6 — Documentos
Substituir concatenação direta de HTML por pipeline:

`dados estruturados -> view model -> renderer -> snapshot`

O snapshot deve registrar:
- paciente;
- consulta;
- tipo do documento;
- versão;
- momento;
- profissional;
- conteúdo aprovado.

## Etapa 7 — Longitudinalidade
Depois da equivalência funcional da AGA:
- estabelecer primeira AGA como baseline;
- carregar problemas ativos nas consultas seguintes;
- mostrar alterações desde a última consulta;
- manter timeline;
- gerar gráficos.

## Itens do legado que devem desaparecer da nova UX
- “Copiar p/ Tasy”;
- dependência de arrastar arquivo manualmente para Google Drive;
- estado clínico apenas na memória do navegador;
- gravação principal por arquivo JSON;
- componentes clínicos acoplados a concatenação de HTML.

O botão final deve ser simplesmente **“Copiar para prontuário”**.

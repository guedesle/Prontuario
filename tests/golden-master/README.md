# Golden master tests

## Objetivo
Garantir que a extração das regras do `legacy/AGA-1.html` não altere silenciosamente o resultado clínico.

## Estrutura esperada
Cada fixture deve conter:
```json
{
  "name": "descricao do caso",
  "input": {},
  "expected": {
    "scores": {},
    "classifications": {},
    "problems": [],
    "interventions": []
  }
}
```

## Casos obrigatórios
1. avaliação vazia;
2. avaliação totalmente preservada;
3. cada ponto de corte no valor exato;
4. um ponto abaixo e acima de cada corte;
5. múltiplos domínios alterados;
6. problema manual combinado com problema automático;
7. problema resolvido;
8. medicações contínuas e temporárias;
9. escolaridade alterando instrumento que dependa dela;
10. ausência de dados em campos opcionais.

## Regra
Uma divergência só pode ser aceita quando:
- a alteração clínica é intencional;
- a justificativa está documentada;
- a médica revisou;
- o novo resultado foi atualizado como novo golden master.

import assert from "node:assert/strict";
import test from "node:test";
import { scoreZaritPalliative7 } from "../../src/domain/institutional-scales.ts";

function answersFor(total: number) {
  const answers: Record<string, number> = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`zp${i+1}`, 1]));
  let extra = total - 7;
  for (let i=1; i<=7 && extra>0; i++) {
    const add = Math.min(4, extra);
    answers[`zp${i}`] += add;
    extra -= add;
  }
  return answers;
}

test("Zarit institucional 7 itens respeita 7-14 / 15-21 / lacuna 22 / 23-35", () => {
  assert.equal(scoreZaritPalliative7(answersFor(7)).cor, "verde");
  assert.equal(scoreZaritPalliative7(answersFor(14)).cor, "verde");
  assert.equal(scoreZaritPalliative7(answersFor(15)).cor, "amarelo");
  assert.equal(scoreZaritPalliative7(answersFor(21)).cor, "amarelo");
  const gap = scoreZaritPalliative7(answersFor(22));
  assert.equal(gap.cor, "cinza");
  assert.ok(gap.classe.includes("não definido"));
  assert.equal(scoreZaritPalliative7(answersFor(23)).cor, "vermelho");
  assert.equal(scoreZaritPalliative7(answersFor(35)).cor, "vermelho");
});

test("Zarit institucional falha fechada quando incompleta ou fora de 1-5", () => {
  assert.equal(scoreZaritPalliative7({ zp1: 1 }).score, null);
  assert.equal(scoreZaritPalliative7({ zp1:1,zp2:1,zp3:1,zp4:1,zp5:1,zp6:1,zp7:0 }).score, null);
});

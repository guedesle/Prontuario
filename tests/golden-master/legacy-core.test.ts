import assert from "node:assert/strict";
import test from "node:test";
import { legacyScales } from "../../src/domain/legacy-scales.ts";

function answers(prefix: string, values: number[]) {
  return Object.fromEntries(values.map((value, index) => [`${prefix}${index + 1}`, value]));
}

test("Katz preserva exatamente os limites 6 / 3-5 / 0-2", () => {
  assert.equal(legacyScales.katz(answers("k", [1, 1, 1, 1, 1, 1])).classe, "Independente");
  assert.equal(legacyScales.katz(answers("k", [1, 1, 1, 0, 0, 0])).classe, "Dependência moderada");
  assert.equal(legacyScales.katz(answers("k", [1, 1, 0, 0, 0, 0])).classe, "Dependência severa");
});

test("Pfeffer muda para comprometido exatamente em 6", () => {
  assert.equal(legacyScales.pfeffer(answers("p", [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).cor, "verde");
  assert.equal(legacyScales.pfeffer(answers("p", [3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0])).cor, "vermelho");
});

test("GDS-15 respeita bordas 5, 6, 10 e 11", () => {
  assert.equal(legacyScales.gds15(answers("g", [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0])).cor, "verde");
  assert.equal(legacyScales.gds15(answers("g", [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0])).cor, "amarelo");
  assert.equal(legacyScales.gds15(answers("g", [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0])).cor, "amarelo");
  assert.equal(legacyScales.gds15(answers("g", [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0])).cor, "vermelho");
});

test("CAM só é positivo quando 1 e 2 e (3 ou 4)", () => {
  assert.equal(legacyScales.cam({ c1: 1, c2: 1, c3: 1, c4: 0 }).scoreText, "Positivo");
  assert.equal(legacyScales.cam({ c1: 1, c2: 1, c3: 0, c4: 1 }).scoreText, "Positivo");
  assert.equal(legacyScales.cam({ c1: 1, c2: 0, c3: 1, c4: 1 }).scoreText, "Negativo");
  assert.equal(legacyScales.cam({ c1: 0, c2: 1, c3: 1, c4: 1 }).scoreText, "Negativo");
});

test("MoCA preserva faixas do legado 0-17 / 18-25 / 26-30", () => {
  assert.equal(legacyScales.moca(17).cor, "vermelho");
  assert.equal(legacyScales.moca(18).cor, "amarelo");
  assert.equal(legacyScales.moca(25).cor, "amarelo");
  assert.equal(legacyScales.moca(26).cor, "verde");
});

test("MEEM aplica corte por escolaridade", () => {
  assert.equal(legacyScales.meem(19, "Analfabeto").cor, "vermelho");
  assert.equal(legacyScales.meem(20, "Analfabeto").cor, "verde");
  assert.equal(legacyScales.meem(28, "Mais de 11 anos").cor, "vermelho");
  assert.equal(legacyScales.meem(29, "Mais de 11 anos").cor, "verde");
});

test("FRAIL-BR preserva robusto / pré-frágil / frágil", () => {
  assert.equal(legacyScales.frailBr(answers("f", [0,0,0,0,0])).cor, "verde");
  assert.equal(legacyScales.frailBr(answers("f", [1,0,0,0,0])).cor, "amarelo");
  assert.equal(legacyScales.frailBr(answers("f", [1,1,1,0,0])).cor, "vermelho");
});

test("SARC-F torna-se positivo em 4", () => {
  assert.equal(legacyScales.sarcf(answers("sf", [1,1,1,0,0])).cor, "verde");
  assert.equal(legacyScales.sarcf(answers("sf", [2,2,0,0,0])).cor, "vermelho");
});

test("preensão usa cortes por sexo com igualdade preservada", () => {
  assert.equal(legacyScales.grip(15.5, "Feminino").cor, "vermelho");
  assert.equal(legacyScales.grip(16, "Feminino").cor, "verde");
  assert.equal(legacyScales.grip(26.5, "Masculino").cor, "vermelho");
  assert.equal(legacyScales.grip(27, "Masculino").cor, "verde");
});

test("velocidade de marcha deriva 4/tempo e usa 0,8 m/s", () => {
  assert.equal(legacyScales.gaitSpeed4m(5).score, 0.8);
  assert.equal(legacyScales.gaitSpeed4m(5).cor, "vermelho");
  assert.equal(legacyScales.gaitSpeed4m(4.9).cor, "verde");
});

test("sentar-levantar 5x usa > 15 s como reduzido", () => {
  assert.equal(legacyScales.chairStand5x(15).cor, "verde");
  assert.equal(legacyScales.chairStand5x(15.1).cor, "vermelho");
});

test("SPPB preserva 10-12 verde, 7-9 amarelo e <=6 vermelho", () => {
  assert.equal(legacyScales.sppb({ s1: 4, s2: 3, s3: 3 }).cor, "verde");
  assert.equal(legacyScales.sppb({ s1: 3, s2: 3, s3: 3 }).cor, "amarelo");
  assert.equal(legacyScales.sppb({ s1: 2, s2: 2, s3: 2 }).cor, "vermelho");
});

test("antropometria preserva pontos de corte do legado", () => {
  assert.equal(legacyScales.anthropometry({ weight: 55, height: 1.6 }).bmi?.cor, "vermelho");
  assert.equal(legacyScales.anthropometry({ weight: 60, height: 1.6 }).bmi?.cor, "verde");
  assert.equal(legacyScales.anthropometry({ weight: 70, height: 1.6 }).bmi?.cor, "amarelo");
  assert.equal(legacyScales.anthropometry({ weight: 90, weight6m: 100 }).weightLoss6m?.cor, "vermelho");
  assert.equal(legacyScales.anthropometry({ calf: 30.9 }).calf?.cor, "amarelo");
  assert.equal(legacyScales.anthropometry({ calf: 31 }).calf?.cor, "verde");
});

test("10-CS soma 7 itens, aplica ajuste de escolaridade e limita a 10", () => {
  const raw6 = { dc1: 1, dc2: 1, dc3: 1, dc4: 2, dc5: 1, dc6: 0, dc7: 0 };
  const raw5 = { dc1: 1, dc2: 1, dc3: 1, dc4: 1, dc5: 1, dc6: 0, dc7: 0 };
  const raw10 = { dc1: 1, dc2: 1, dc3: 1, dc4: 4, dc5: 1, dc6: 1, dc7: 1 };

  const illiterate = legacyScales.tenCs(raw6, "Analfabeto");
  assert.equal(illiterate.rawScore, 6);
  assert.equal(illiterate.adjustment, 2);
  assert.equal(illiterate.score, 8);
  assert.equal(illiterate.cor, "verde");

  const oneToFour = legacyScales.tenCs(raw5, "1 a 4 anos");
  assert.equal(oneToFour.score, 6);
  assert.equal(oneToFour.cor, "amarelo");

  const highEducation = legacyScales.tenCs(raw5, "Mais de 11 anos");
  assert.equal(highEducation.score, 5);
  assert.equal(highEducation.cor, "vermelho");

  assert.equal(legacyScales.tenCs(raw10, "Analfabeto").score, 10);
});

test("KPS preserva 90-100 / 70-80 / 10-60", () => {
  assert.equal(legacyScales.kps(90).cor, "verde");
  assert.equal(legacyScales.kps(80).cor, "amarelo");
  assert.equal(legacyScales.kps(70).cor, "amarelo");
  assert.equal(legacyScales.kps(60).cor, "vermelho");
});

test("LACE preserva pesos e faixas 0-4 / 5-9 / 10-19", () => {
  assert.equal(legacyScales.lace({ la1: 1, la2: 0, la3: 1, la4: 0 }).cor, "verde");
  assert.equal(legacyScales.lace({ la1: 5, la2: 0, la3: 0, la4: 0 }).cor, "amarelo");
  assert.equal(legacyScales.lace({ la1: 7, la2: 3, la3: 5, la4: 4 }).score, 19);
  assert.equal(legacyScales.lace({ la1: 7, la2: 3, la3: 5, la4: 4 }).cor, "vermelho");
});

test("STOPPFall preserva 0 / 1-2 / 3-14 classes de risco", () => {
  assert.equal(legacyScales.stoppFall({}).cor, "verde");
  assert.equal(legacyScales.stoppFall({ sfl1: 1 }).cor, "amarelo");
  assert.equal(legacyScales.stoppFall({ sfl1: 1, sfl2: 1 }).cor, "amarelo");
  assert.equal(legacyScales.stoppFall({ sfl1: 1, sfl2: 1, sfl3: 1 }).cor, "vermelho");
});

test("Lawton preserva 21 / 8-20 / 7", () => {
  assert.equal(legacyScales.lawton({ l1:3,l2:3,l3:3,l4:3,l5:3,l6:3,l7:3 }).cor, "verde");
  assert.equal(legacyScales.lawton({ l1:3,l2:3,l3:3,l4:3,l5:3,l6:3,l7:2 }).score, 20);
  assert.equal(legacyScales.lawton({ l1:3,l2:3,l3:3,l4:3,l5:3,l6:3,l7:2 }).cor, "amarelo");
  assert.equal(legacyScales.lawton({ l1:2,l2:1,l3:1,l4:1,l5:1,l6:1,l7:1 }).score, 8);
  assert.equal(legacyScales.lawton({ l1:2,l2:1,l3:1,l4:1,l5:1,l6:1,l7:1 }).cor, "amarelo");
  assert.equal(legacyScales.lawton({ l1:1,l2:1,l3:1,l4:1,l5:1,l6:1,l7:1 }).cor, "vermelho");
});

function barthelAnswersFor(target: number) {
  const ids = ["b1","b2","b3","b4","b5","b6","b7","b8","b9","b10"];
  const caps = [10,5,5,10,10,10,10,15,15,10];
  let remaining = target;
  return Object.fromEntries(ids.map((id, index) => {
    const value = Math.min(caps[index], remaining);
    remaining -= value;
    return [id, value];
  }));
}

test("Barthel preserva todas as faixas funcionais do legado", () => {
  for (const [score, color, klass] of [
    [100, "verde", "Independente"],
    [95, "amarelo", "Dependência leve"],
    [60, "amarelo", "Dependência leve"],
    [55, "amarelo", "Dependência moderada"],
    [40, "amarelo", "Dependência moderada"],
    [35, "vermelho", "Dependência grave"],
    [20, "vermelho", "Dependência grave"],
    [15, "vermelho", "Dependência total"],
    [0, "vermelho", "Dependência total"],
  ] as const) {
    const result = legacyScales.barthel(barthelAnswersFor(score));
    assert.equal(result.score, score);
    assert.equal(result.cor, color);
    assert.equal(result.classe, klass);
  }
});

test("polifarmácia preserva 0-1 / 2-3 / 4-7", () => {
  assert.equal(legacyScales.polypharmacy({ pf1: 1 }).cor, "verde");
  assert.equal(legacyScales.polypharmacy({ pf2: 2 }).cor, "amarelo");
  assert.equal(legacyScales.polypharmacy({ pf2: 2, pf3: 1 }).cor, "amarelo");
  assert.equal(legacyScales.polypharmacy({ pf1: 2, pf2: 2 }).cor, "vermelho");
  assert.equal(legacyScales.polypharmacy({ pf1:2,pf2:2,pf3:1,pf4:1,pf5:1 }).score, 7);
});

function cornellAnswersFor(target: number) {
  let remaining = target;
  return Object.fromEntries(Array.from({ length: 19 }, (_, index) => {
    const value = Math.min(2, remaining);
    remaining -= value;
    return [`co${index + 1}`, value];
  }));
}

test("Cornell preserva bordas 7 / 8 / 11 / 12 / 38", () => {
  assert.equal(legacyScales.cornell(cornellAnswersFor(7)).cor, "verde");
  assert.equal(legacyScales.cornell(cornellAnswersFor(8)).cor, "amarelo");
  assert.equal(legacyScales.cornell(cornellAnswersFor(11)).cor, "amarelo");
  assert.equal(legacyScales.cornell(cornellAnswersFor(12)).cor, "vermelho");
  assert.equal(legacyScales.cornell(cornellAnswersFor(38)).score, 38);
  assert.equal(legacyScales.cornell(cornellAnswersFor(38)).cor, "vermelho");
});

test("G8 preserva corte <=14 vs >14 e aceita meio ponto", () => {
  const max17 = { g81:2,g82:3,g83:2,g84:2,g85:3,g86:1,g87:2,g88:2 };
  const score14 = { ...max17, g81:0, g86:0 };
  const score145 = { ...max17, g81:1, g87:0.5 };

  assert.equal(legacyScales.g8(max17).score, 17);
  assert.equal(legacyScales.g8(max17).cor, "verde");
  assert.equal(legacyScales.g8(score14).score, 14);
  assert.equal(legacyScales.g8(score14).cor, "vermelho");
  assert.equal(legacyScales.g8(score145).score, 14.5);
  assert.equal(legacyScales.g8(score145).cor, "verde");
});

test("APGAR familiar preserva 0-3 / 4-6 / 7-10", () => {
  assert.equal(legacyScales.apgarFamily({ a1:1,a2:1,a3:1,a4:0,a5:0 }).score, 3);
  assert.equal(legacyScales.apgarFamily({ a1:1,a2:1,a3:1,a4:0,a5:0 }).cor, "vermelho");
  assert.equal(legacyScales.apgarFamily({ a1:1,a2:1,a3:1,a4:1,a5:0 }).cor, "amarelo");
  assert.equal(legacyScales.apgarFamily({ a1:2,a2:1,a3:1,a4:1,a5:1 }).score, 6);
  assert.equal(legacyScales.apgarFamily({ a1:2,a2:1,a3:1,a4:1,a5:1 }).cor, "amarelo");
  assert.equal(legacyScales.apgarFamily({ a1:2,a2:2,a3:1,a4:1,a5:1 }).score, 7);
  assert.equal(legacyScales.apgarFamily({ a1:2,a2:2,a3:1,a4:1,a5:1 }).cor, "verde");
});

test("Zarit reduzida preserva 0-10 / 11-16 / 17-28 do legado", () => {
  assert.equal(legacyScales.zaritReduced({ z1:4,z2:4,z3:2 }).score, 10);
  assert.equal(legacyScales.zaritReduced({ z1:4,z2:4,z3:2 }).cor, "verde");
  assert.equal(legacyScales.zaritReduced({ z1:4,z2:4,z3:3 }).score, 11);
  assert.equal(legacyScales.zaritReduced({ z1:4,z2:4,z3:3 }).cor, "amarelo");
  assert.equal(legacyScales.zaritReduced({ z1:4,z2:4,z3:4,z4:4 }).score, 16);
  assert.equal(legacyScales.zaritReduced({ z1:4,z2:4,z3:4,z4:4 }).cor, "amarelo");
  assert.equal(legacyScales.zaritReduced({ z1:4,z2:4,z3:4,z4:4,z5:1 }).score, 17);
  assert.equal(legacyScales.zaritReduced({ z1:4,z2:4,z3:4,z4:4,z5:1 }).cor, "vermelho");
  assert.equal(legacyScales.zaritReduced({ z1:4,z2:4,z3:4,z4:4,z5:4,z6:4,z7:4 }).score, 28);
});

test("VES-13 preserva corte de vulnerabilidade em 3", () => {
  assert.equal(legacyScales.ves13({ v1:1,v2:1,v3:0,v4:0 }).score, 2);
  assert.equal(legacyScales.ves13({ v1:1,v2:1,v3:0,v4:0 }).cor, "verde");
  assert.equal(legacyScales.ves13({ v1:3,v2:0,v3:0,v4:0 }).score, 3);
  assert.equal(legacyScales.ves13({ v1:3,v2:0,v3:0,v4:0 }).cor, "vermelho");
  assert.equal(legacyScales.ves13({ v1:3,v2:1,v3:2,v4:4 }).score, 10);
});

test("Charlson soma pesos do legado e ajuste etário até o máximo de 4", () => {
  const noComorbidity49 = legacyScales.charlson({}, 49);
  assert.equal(noComorbidity49.score, 0);
  assert.equal(noComorbidity49.adjustment, 0);
  assert.equal(noComorbidity49.cor, "verde");

  const age50 = legacyScales.charlson({}, 50);
  assert.equal(age50.score, 1);
  assert.equal(age50.adjustment, 1);

  const age70 = legacyScales.charlson({}, 70);
  assert.equal(age70.score, 3);
  assert.equal(age70.adjustment, 3);
  assert.equal(age70.cor, "amarelo");

  const metastatic80 = legacyScales.charlson({ ch18: true }, 80);
  assert.equal(metastatic80.baseScore, 6);
  assert.equal(metastatic80.adjustment, 4);
  assert.equal(metastatic80.score, 10);
  assert.equal(metastatic80.cor, "vermelho");
});

test("Charlson reproduz o checklist do legado sem corrigir seleção simultânea de gravidades", () => {
  const result = legacyScales.charlson({ ch10: true, ch11: true }, 40);
  assert.equal(result.baseScore, 3);
  assert.equal(result.cor, "amarelo");
});

test("MNA-SF usa IMC quando disponível e panturrilha somente como substituta", () => {
  const preservedBase = { n1:2,n2:3,n3:2,n4:2,n5:2 };

  const bmiNormal = legacyScales.mnaSf({ answers: preservedBase, bmi: 23 });
  assert.equal(bmiNormal.anthropometrySource, "bmi");
  assert.equal(bmiNormal.anthropometryPoints, 3);
  assert.equal(bmiNormal.score, 14);
  assert.equal(bmiNormal.cor, "verde");

  const bmiRisk = legacyScales.mnaSf({ answers: { n1:1,n2:2,n3:1,n4:2,n5:1 }, bmi: 21 });
  assert.equal(bmiRisk.score, 9);
  assert.equal(bmiRisk.cor, "amarelo");

  const calfMalnutrition = legacyScales.mnaSf({ answers: { n1:0,n2:0,n3:0,n4:0,n5:0 }, calfCm: 30.9 });
  assert.equal(calfMalnutrition.anthropometrySource, "calf");
  assert.equal(calfMalnutrition.score, 0);
  assert.equal(calfMalnutrition.cor, "vermelho");

  const prefersBmi = legacyScales.mnaSf({ answers: preservedBase, bmi: 18.9, calfCm: 35 });
  assert.equal(prefersBmi.anthropometrySource, "bmi");
  assert.equal(prefersBmi.anthropometryPoints, 0);
  assert.equal(prefersBmi.score, 11);
  assert.equal(prefersBmi.cor, "amarelo");

  const missing = legacyScales.mnaSf({ answers: preservedBase });
  assert.equal(missing.score, null);
  assert.equal(missing.cor, "cinza");
});

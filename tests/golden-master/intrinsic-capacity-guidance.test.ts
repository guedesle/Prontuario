import assert from "node:assert/strict";
import test from "node:test";
import { buildIntrinsicCapacityGuidance } from "../../src/domain/intrinsic-capacity-guidance.ts";

test("gera orientações somente para domínios alterados e avaliados na consulta alvo", () => {
  const guidance = buildIntrinsicCapacityGuidance([
    { scaleId: "sarcf", scaleName: "SARC-F", color: "vermelho", assessedInTargetConsultation: true },
    { scaleId: "mna_sf", scaleName: "MNA-SF", color: "amarelo", assessedInTargetConsultation: true },
    { scaleId: "cornell", scaleName: "Cornell", color: "verde", assessedInTargetConsultation: true },
    { scaleId: "dez_cs", scaleName: "10-CS", color: "vermelho", assessedInTargetConsultation: false },
  ]);

  assert.deepEqual(guidance.alteredDomains.map((domain) => domain.code), ["locomocao", "vitalidade"]);
  assert.deepEqual(guidance.alteredDomains[0]?.triggeredBy, ["SARC-F"]);
  assert.deepEqual(guidance.alteredDomains[1]?.triggeredBy, ["MNA-SF"]);
  assert.ok(guidance.alteredDomains.every((domain) => domain.actions.length >= 4));
  assert.ok(guidance.alteredDomains.every((domain) => domain.attentionSigns.length >= 2));
});

test("não inventa alteração quando a avaliação está preservada ou ausente", () => {
  const guidance = buildIntrinsicCapacityGuidance([
    { scaleId: "fast", scaleName: "FAST", color: "verde", assessedInTargetConsultation: true },
  ]);

  assert.deepEqual(guidance.alteredDomains, []);
});

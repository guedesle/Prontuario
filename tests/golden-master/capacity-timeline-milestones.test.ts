import assert from "node:assert/strict";
import test from "node:test";
import { PROBLEM_LOGICAL_DELETION_NOTE } from "../../src/domain/as-of-consultation.ts";
import { buildProblemCapacityMilestones } from "../../src/domain/capacity-timeline-milestones.ts";

test("marcos do gráfico usam somente fatos documentados e consultas elegíveis", () => {
  const milestones = buildProblemCapacityMilestones({
    patientId: "p1",
    consultationIds: ["c2"],
    problems: [{
      patientId: "p1",
      originConsultationId: "c1",
      title: "AVC",
      description: "diagnóstico registrado",
      createdAt: "2026-01-01",
      events: [
        { patientId: "p1", consultationId: "c2", note: "internamento documentado", createdAt: "2026-02-01" },
        { patientId: "p1", consultationId: "c3", note: "fora do ciclo", createdAt: "2026-03-01" },
      ],
    }],
  });

  assert.deepEqual(milestones.map((item) => [item.consultationId, item.title, item.note]), [["c2", "AVC", "internamento documentado"]]);
});

test("problema retirado logicamente não reaparece como explicação do gráfico", () => {
  const milestones = buildProblemCapacityMilestones({
    patientId: "p1",
    problems: [{
      patientId: "p1",
      originConsultationId: "c1",
      title: "Registro equivocado",
      description: "não deve aparecer",
      createdAt: "2026-01-01",
      events: [{ patientId: "p1", consultationId: "c1", note: PROBLEM_LOGICAL_DELETION_NOTE, createdAt: "2026-01-02" }],
    }],
  });
  assert.deepEqual(milestones, []);
});

test("marcos falham fechado ao misturar pacientes", () => {
  assert.throws(() => buildProblemCapacityMilestones({
    patientId: "p1",
    problems: [{ patientId: "p2", originConsultationId: "c1", title: "Outro paciente", createdAt: "2026-01-01", events: [] }],
  }), /pacientes diferentes/);
});

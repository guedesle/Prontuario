import assert from "node:assert/strict";
import test from "node:test";
import { buildConsultationContextViewModel } from "../../src/domain/consultation-context.ts";

const base = {
  consultationId: "consultation-1",
  type: "AGA_INITIAL" as const,
  status: "DRAFT" as const,
  occurredAt: new Date("2026-08-19T12:00:00.000Z"),
  patient: {
    id: "patient-1",
    fullName: "Maria da Silva",
    birthDate: new Date("1940-03-05T12:00:00.000Z"),
    needsIdentityReview: false,
  },
};

test("contexto identifica paciente e consulta em linguagem clínica legível", () => {
  const context = buildConsultationContextViewModel(base);
  assert.equal(context.patientName, "Maria da Silva");
  assert.equal(context.patientBirthDateLabel, "05/03/1940");
  assert.equal(context.consultationTypeLabel, "AGA inicial");
  assert.equal(context.consultationDateLabel, "19/08/2026");
  assert.equal(context.consultationStatusLabel, "Rascunho");
});

test("contexto preserva alerta de identidade pendente", () => {
  const context = buildConsultationContextViewModel({
    ...base,
    patient: { ...base.patient, needsIdentityReview: true },
  });
  assert.equal(context.needsIdentityReview, true);
});

test("contexto normaliza espaços do nome sem reinterpretar identidade", () => {
  const context = buildConsultationContextViewModel({
    ...base,
    patient: { ...base.patient, fullName: "  Maria   da\nSilva  " },
  });
  assert.equal(context.patientName, "Maria da Silva");
});

test("contexto falha fechado sem paciente identificado", () => {
  assert.throws(
    () => buildConsultationContextViewModel({
      ...base,
      patient: { ...base.patient, fullName: "   " },
    }),
    /sem paciente identificado/i,
  );
});

test("contexto rotula consulta subsequente finalizada sem mudar valores persistidos", () => {
  const context = buildConsultationContextViewModel({
    ...base,
    type: "FOLLOW_UP",
    status: "FINALIZED",
  });
  assert.equal(context.consultationTypeLabel, "Consulta subsequente");
  assert.equal(context.consultationStatusLabel, "Finalizada");
});

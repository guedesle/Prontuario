import assert from "node:assert/strict";
import test from "node:test";
import { canSubmitProblemStatusChange } from "../../src/domain/problem-status-review.ts";

test("mudança de status exige revisão clínica explícita", () => {
  assert.equal(canSubmitProblemStatusChange({
    editable: true,
    saving: false,
    currentStatus: "ACTIVE",
    nextStatus: "RESOLVED",
    reviewConfirmed: false,
  }), false);

  assert.equal(canSubmitProblemStatusChange({
    editable: true,
    saving: false,
    currentStatus: "ACTIVE",
    nextStatus: "RESOLVED",
    reviewConfirmed: true,
  }), true);
});

test("status idêntico não gera evento redundante mesmo após confirmação", () => {
  assert.equal(canSubmitProblemStatusChange({
    editable: true,
    saving: false,
    currentStatus: "MONITORING",
    nextStatus: "MONITORING",
    reviewConfirmed: true,
  }), false);
});

test("consulta não editável ou gravação em andamento permanece bloqueada", () => {
  assert.equal(canSubmitProblemStatusChange({
    editable: false,
    saving: false,
    currentStatus: "STABLE",
    nextStatus: "ACTIVE",
    reviewConfirmed: true,
  }), false);

  assert.equal(canSubmitProblemStatusChange({
    editable: true,
    saving: true,
    currentStatus: "STABLE",
    nextStatus: "ACTIVE",
    reviewConfirmed: true,
  }), false);
});

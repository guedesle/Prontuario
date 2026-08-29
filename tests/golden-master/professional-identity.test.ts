import assert from "node:assert/strict";
import test from "node:test";
import { buildProfessionalIdentity } from "../../src/domain/professional-identity.ts";

test("perfil Natalia preserva logo e identificação profissional completas", () => {
  const identity = buildProfessionalIdentity({
    name: "Natalia Mendes",
    email: "owner@example.test",
  });

  assert.equal(identity.personalizedBrand, true);
  assert.equal(identity.displayName, "Dra. Natalia Mendes");
  assert.equal(identity.roleLabel, "Médica Geriatra");
  assert.equal(identity.registrationLine, "CRM-BA 27416 · RQE 24673");
  assert.equal(identity.logoPath, "/brand/natalia-mendes-logo.svg");
});

test("outra médica usa somente a própria identidade autenticada", () => {
  const identity = buildProfessionalIdentity({
    name: "Dra. Médica Sintética",
    email: "medica.sintetica@example.test",
  });

  assert.equal(identity.personalizedBrand, false);
  assert.equal(identity.displayName, "Dra. Médica Sintética");
  assert.equal(identity.roleLabel, "Profissional responsável");
  assert.equal(identity.registrationLine, undefined);
  assert.equal(identity.logoPath, undefined);
  assert.equal(identity.logoAlt, undefined);
});

test("e-mail configurado do titular da marca é autoritativo", () => {
  const notOwner = buildProfessionalIdentity({
    name: "Natalia Mendes",
    email: "outra@example.test",
    brandOwnerEmail: "titular@example.test",
  });
  assert.equal(notOwner.personalizedBrand, false);
  assert.equal(notOwner.registrationLine, undefined);
  assert.equal(notOwner.logoPath, undefined);

  const owner = buildProfessionalIdentity({
    name: "Nome retornado pelo provedor",
    email: "TITULAR@example.test",
    brandOwnerEmail: "titular@example.test",
  });
  assert.equal(owner.personalizedBrand, true);
  assert.equal(owner.displayName, "Dra. Natalia Mendes");
});

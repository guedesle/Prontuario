import { createHash } from "node:crypto";
import type { SoapDraftFields } from "../../domain/consultation-note-contract.ts";

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, stableValue(record[key])]),
  );
}

/**
 * Versão otimista somente do conteúdo que o editor SOAP realmente controla.
 * Alterações independentes da consulta (escalas, medicamentos, workflow etc.)
 * não invalidam o rascunho do médico.
 */
export function consultationNoteVersion(input: {
  fields: SoapDraftFields;
  examsText: string;
}): string {
  const payload = stableValue({
    fields: input.fields,
    examsText: input.examsText,
  });
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

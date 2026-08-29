import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildAgaReportModel } from "../../src/domain/aga-report.ts";
import { renderAccessibleAgaReportText } from "../../src/domain/accessible-aga-report-text.ts";
import {
  consultationStatusLabel,
  problemStatusLabel,
  sourceStatusLabel,
} from "../../src/domain/accessible-report-language.ts";
import { GERIATRIC_PROBLEM_PRESETS } from "../../src/domain/geriatric-problem-presets.ts";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

test("vocabulário geriátrico usa exatamente a lista aprovada e não restaura os atalhos antigos", () => {
  assert.deepEqual([...GERIATRIC_PROBLEM_PRESETS], [
    "Fragilidade",
    "Comprometimento cognitivo",
    "Imobilidade",
    "Restrição da mobilidade",
    "Comprometimento multissensorial",
    "Lesão por pressão",
    "Sarcopenia",
    "Desnutrição",
    "Delirium",
    "Transtorno do humor",
    "Ansiedade",
    "Polifarmácia (>5 medicações)",
    "Incontinência urinária",
    "Incontinência fecal",
    "Queda",
  ]);

  const workspace = source("src/components/problems/problem-workspace.tsx");
  assert.match(workspace, /GERIATRIC_PROBLEM_PRESETS/);
  assert.match(workspace, /Nada é incluído automaticamente/);
  assert.match(workspace, /aria-pressed=\{selected\}/);
  assert.match(workspace, /aria-live="polite"/);
  assert.match(workspace, /Confirme o termo antes de adicionar/);
  assert.match(workspace, /Detalhes do problema selecionado \(opcional\)/);
  assert.match(workspace, /<textarea/);
  assert.doesNotMatch(workspace, /Incapacidade cognitiva|Instabilidade postural|Insuficiência familiar|Incapacidade comunicativa/);
});

test("rótulos compartilhados traduzem códigos internos sem mudar os códigos persistidos", () => {
  assert.equal(consultationStatusLabel("DRAFT"), "Em preenchimento");
  assert.equal(consultationStatusLabel("IN_REVIEW"), "Em revisão");
  assert.equal(problemStatusLabel("ACTIVE"), "Ativo");
  assert.equal(problemStatusLabel("RESOLVED"), "Resolvido");
  assert.equal(sourceStatusLabel("confirmed-primary"), "Fonte principal confirmada");
  assert.equal(sourceStatusLabel("needs-review"), "Fonte em revisão");
});

test("texto exportado do relatório não expõe estados internos em inglês", () => {
  const report = buildAgaReportModel({
    patientId: "p1",
    consultationId: "c1",
    consultationStatus: "DRAFT",
    patientName: "Paciente Teste",
    longitudinalAssessments: [],
    longitudinalProblems: [
      { id: "c", patientId: "p1", type: "CLINICAL", status: "ACTIVE", title: "Hipertensão arterial" },
      { id: "g", patientId: "p1", type: "GERIATRIC", status: "RESOLVED", title: "Queda" },
    ],
    vaccinationReview: { status: "PENDING", pendingVaccines: ["Influenza"] },
  });

  const text = renderAccessibleAgaReportText(report);
  assert.match(text, /Situação: Em preenchimento/);
  assert.match(text, /Hipertensão arterial \[Ativo\]/);
  assert.match(text, /Queda \[Resolvido\]/);
  assert.match(text, /Há vacinas pendentes registradas/);
  assert.doesNotMatch(text, /\b(?:DRAFT|IN_REVIEW|FINALIZED|ACTIVE|STABLE|MONITORING|RESOLVED|PENDING|UNKNOWN|UP_TO_DATE|READY|REQUIRES_REVIEW|NOT_AVAILABLE)\b/);
  assert.doesNotMatch(text, /\bbaseline\b|pending-medical-review/i);
});

test("relatório visual usa linguagem acessível e não imprime status bruto ou termos de infraestrutura", () => {
  const reportDocument = source("src/components/reports/aga-report-document-preview.tsx");
  const generator = source("src/server/clinical/generate-aga-report.ts");

  assert.match(generator, /renderAccessibleAgaReportText/);
  assert.match(reportDocument, /sourceStatusLabel\(scale\.source\.status\)/);
  assert.match(reportDocument, /Versão do relatório/);
  assert.match(reportDocument, /Mostrar informações técnicas/);
  assert.match(reportDocument, /Gere a prévia, revise o conteúdo e só depois libere/);
  assert.doesNotMatch(reportDocument, />Snapshot</);
  assert.doesNotMatch(reportDocument, />schema</);
  assert.doesNotMatch(reportDocument, /<dd>\{scale\.source\.status\}/);
});

test("relatório final é superfície única para a família e não restaura editor profissional duplicado", () => {
  const workspace = source("src/components/reports/report-workspace-tabs.tsx");

  assert.match(workspace, /AgaReportDocumentPreview/);
  assert.match(workspace, /Relatório final da consulta/);
  assert.doesNotMatch(workspace, /GeriatricConductWorkspace/);
  assert.doesNotMatch(workspace, /geriatric-conduct-panel/);
  assert.doesNotMatch(workspace, /role="tablist"/);
  assert.doesNotMatch(workspace, /ArrowRight|ArrowLeft/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GERIATRIC_PROBLEM_PRESETS } from "../../src/domain/geriatric-problem-presets.ts";

const workspace = readFileSync("src/components/problems/problem-workspace.tsx", "utf8");

test("catálogo geriátrico usa exatamente as opções clínicas aprovadas", () => {
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
});

test("seleção de problema geriátrico libera texto complementar sem inclusão automática", () => {
  assert.match(workspace, /selectedGeriatricPreset/);
  assert.match(workspace, /Detalhes do problema selecionado \(opcional\)/);
  assert.match(workspace, /<textarea/);
  assert.match(workspace, /description: description\.trim\(\) \|\| undefined/);
  assert.match(workspace, /Nada é incluído automaticamente/);
  assert.match(workspace, /disabled=\{!title\.trim\(\) \|\| saving\}/);
});

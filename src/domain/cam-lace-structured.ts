import { scoreNumeric } from "./clinical-engine.ts";
import { LACE } from "./clinical-config/legacy-core.ts";

export const CAM_STRUCTURED_CODE = "cam" as const;
export const CAM_STRUCTURED_VERSION = "cam-4-feature-algorithm-2026-08-v1" as const;
export const LACE_STRUCTURED_CODE = "lace" as const;
export const LACE_STRUCTURED_VERSION = "lace-components-2026-08-v1" as const;

const yesNoChoices = [
  { value: 0, label: "Não" },
  { value: 1, label: "Sim" },
] as const;

export const CAM_STRUCTURED_DEFINITION = {
  code: CAM_STRUCTURED_CODE,
  version: CAM_STRUCTURED_VERSION,
  name: "CAM — Confusion Assessment Method",
  dimension: "cognicao",
  instruction: "Marque as quatro características clínicas. O prontuário aplica automaticamente o algoritmo CAM; o resultado é apoio ao reconhecimento de delirium e exige correlação clínica.",
  applicationGuide: [
    {
      title: "Algoritmo CAM",
      items: [
        "Característica 1: início agudo e/ou curso flutuante.",
        "Característica 2: desatenção.",
        "Característica 3: pensamento desorganizado.",
        "Característica 4: nível de consciência alterado.",
        "CAM positivo quando as características 1 e 2 estão presentes, associadas à característica 3 ou 4.",
      ],
    },
    {
      title: "Segurança clínica",
      items: [
        "CAM positivo sugere delirium e requer avaliação clínica da causa e da gravidade; não define etiologia isoladamente.",
        "CAM negativo não exclui delirium quando houver mudança aguda, flutuação ou dúvida clínica; reavalie conforme o contexto.",
      ],
    },
  ],
  sourceNote: "Algoritmo diagnóstico de quatro características do Confusion Assessment Method (Inouye et al., Ann Intern Med. 1990; PMID 2240918).",
  fields: [
    { id: "acuteOrFluctuating", label: "1. Início agudo e/ou curso flutuante", choices: yesNoChoices },
    { id: "inattention", label: "2. Desatenção", choices: yesNoChoices },
    { id: "disorganizedThinking", label: "3. Pensamento desorganizado", choices: yesNoChoices },
    { id: "alteredConsciousness", label: "4. Nível de consciência alterado", choices: yesNoChoices },
  ],
} as const;

export const LACE_STRUCTURED_DEFINITION = {
  code: LACE_STRUCTURED_CODE,
  version: LACE_STRUCTURED_VERSION,
  name: "LACE — risco de morte ou reinternação não eletiva em 30 dias",
  dimension: "prognostico",
  instruction: "Selecione os quatro componentes L, A, C e E. O total de 0 a 19 é calculado automaticamente.",
  applicationGuide: [
    {
      title: "Componentes",
      items: [
        "L — duração da internação.",
        "A — caráter agudo da admissão.",
        "C — índice de comorbidade de Charlson.",
        "E — número de visitas ao pronto atendimento nos seis meses anteriores.",
      ],
    },
    {
      title: "Leitura usada no prontuário",
      items: [
        "0–4: baixo risco no protocolo atual.",
        "5–9: risco intermediário.",
        "10–19: alto risco.",
        "O índice apoia estratificação de risco e não substitui julgamento clínico nem determina conduta isoladamente.",
      ],
    },
  ],
  sourceNote: "Índice LACE derivado e validado por van Walraven et al. (CMAJ. 2010; PMID 20194559). Faixas de interpretação preservadas do protocolo clínico vigente no aplicativo.",
  fields: [
    {
      id: "lengthOfStayPoints",
      label: "L — duração da internação",
      choices: [
        { value: 0, label: "Menos de 1 dia / alta no mesmo dia — 0 ponto" },
        { value: 1, label: "1 dia — 1 ponto" },
        { value: 2, label: "2 dias — 2 pontos" },
        { value: 3, label: "3 dias — 3 pontos" },
        { value: 4, label: "4 a 6 dias — 4 pontos" },
        { value: 5, label: "7 a 13 dias — 5 pontos" },
        { value: 7, label: "14 dias ou mais — 7 pontos" },
      ],
    },
    {
      id: "acuteAdmissionPoints",
      label: "A — admissão aguda pelo pronto atendimento",
      choices: [
        { value: 0, label: "Não — 0 ponto" },
        { value: 3, label: "Sim — 3 pontos" },
      ],
    },
    {
      id: "charlsonPoints",
      label: "C — índice de comorbidade de Charlson",
      choices: [
        { value: 0, label: "Charlson 0 — 0 ponto" },
        { value: 1, label: "Charlson 1 — 1 ponto" },
        { value: 2, label: "Charlson 2 — 2 pontos" },
        { value: 3, label: "Charlson 3 — 3 pontos" },
        { value: 5, label: "Charlson 4 ou mais — 5 pontos" },
      ],
    },
    {
      id: "emergencyVisitPoints",
      label: "E — visitas ao pronto atendimento nos últimos 6 meses",
      choices: [
        { value: 0, label: "Nenhuma — 0 ponto" },
        { value: 1, label: "1 visita — 1 ponto" },
        { value: 2, label: "2 visitas — 2 pontos" },
        { value: 3, label: "3 visitas — 3 pontos" },
        { value: 4, label: "4 ou mais visitas — 4 pontos" },
      ],
    },
  ],
} as const;

function exactChoice(raw: Record<string, unknown>, id: string, allowed: readonly number[]): number {
  const value = raw[id];
  if (typeof value !== "number" || !allowed.includes(value)) throw new Error(`Valor inválido para ${id}.`);
  return value;
}

export function scoreCamStructured(raw: Record<string, unknown>) {
  const allowedIds = new Set(CAM_STRUCTURED_DEFINITION.fields.map((field) => field.id));
  if (Object.keys(raw).some((id) => !allowedIds.has(id))) throw new Error("Resposta CAM contém campo não permitido.");

  const acuteOrFluctuating = exactChoice(raw, "acuteOrFluctuating", [0, 1]);
  const inattention = exactChoice(raw, "inattention", [0, 1]);
  const disorganizedThinking = exactChoice(raw, "disorganizedThinking", [0, 1]);
  const alteredConsciousness = exactChoice(raw, "alteredConsciousness", [0, 1]);
  const positive = acuteOrFluctuating === 1
    && inattention === 1
    && (disorganizedThinking === 1 || alteredConsciousness === 1);

  return {
    answers: { acuteOrFluctuating, inattention, disorganizedThinking, alteredConsciousness },
    result: positive
      ? {
          score: 1,
          scoreText: "CAM positivo",
          classification: "Delirium provável no rastreio",
          interpretation: "O algoritmo CAM foi positivo. O achado requer avaliação clínica imediata da causa, gravidade e segurança; não define etiologia isoladamente.",
          clinicalColor: "vermelho",
        }
      : {
          score: 0,
          scoreText: "CAM negativo",
          classification: "CAM não positivo",
          interpretation: "O algoritmo CAM não foi positivo nesta aplicação. Reavalie se houver início agudo, flutuação, desatenção ou mudança do estado mental.",
          clinicalColor: "verde",
        },
    version: CAM_STRUCTURED_VERSION,
  };
}

export function scoreLaceStructured(raw: Record<string, unknown>) {
  const allowedIds = new Set(LACE_STRUCTURED_DEFINITION.fields.map((field) => field.id));
  if (Object.keys(raw).some((id) => !allowedIds.has(id))) throw new Error("Resposta LACE contém campo não permitido.");

  const lengthOfStayPoints = exactChoice(raw, "lengthOfStayPoints", [0, 1, 2, 3, 4, 5, 7]);
  const acuteAdmissionPoints = exactChoice(raw, "acuteAdmissionPoints", [0, 3]);
  const charlsonPoints = exactChoice(raw, "charlsonPoints", [0, 1, 2, 3, 5]);
  const emergencyVisitPoints = exactChoice(raw, "emergencyVisitPoints", [0, 1, 2, 3, 4]);
  const total = lengthOfStayPoints + acuteAdmissionPoints + charlsonPoints + emergencyVisitPoints;
  const result = scoreNumeric({ raw: total, ranges: LACE.ranges });
  if (result.score === null) throw new Error("Não foi possível interpretar o LACE.");

  return {
    answers: { lengthOfStayPoints, acuteAdmissionPoints, charlsonPoints, emergencyVisitPoints },
    result: {
      score: result.score,
      scoreText: `${result.score}/19`,
      classification: result.classe,
      interpretation: result.texto,
      clinicalColor: result.cor,
    },
    version: LACE_STRUCTURED_VERSION,
  };
}

import type { ScoreRange } from "../clinical-engine.ts";

export const ZARIT_PALLIATIVE_7_MS2013 = {
  id: "zarit_paliativo_7_ms2013",
  version: "MS-AD-CP-2013-7i-1to5",
  name: "Zarit — 7 itens (Atenção Domiciliar / Cuidados Paliativos)",
  itemIds: ["zp1", "zp2", "zp3", "zp4", "zp5", "zp6", "zp7"] as const,
  allowedItemValues: [1, 2, 3, 4, 5] as const,
  ranges: [
    { min: 7, max: 14, classe: "Sobrecarga leve", cor: "verde", texto: "Sobrecarga classificada como leve no material institucional." },
    { min: 15, max: 21, classe: "Sobrecarga moderada", cor: "amarelo", texto: "Sobrecarga classificada como moderada no material institucional." },
    { min: 23, max: 35, classe: "Sobrecarga grave", cor: "vermelho", texto: "Sobrecarga classificada como grave no material institucional." },
  ] satisfies ScoreRange[],
  sourceGapScore: 22,
} as const;

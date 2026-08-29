import type { AgaScaleReportSection } from "./aga-report.ts";

export type FamilyFunctionalCareLevel =
  | "independent"
  | "iadl-support"
  | "adl-support"
  | "high-dependence"
  | "advanced-dementia";

export interface FamilyFunctionalContext {
  level: FamilyFunctionalCareLevel;
  sourceSummary: string;
  fastStage?: string;
  fastScore?: number;
  katzScore?: number;
  barthelScore?: number;
  lawtonScore?: number;
}

const LEVEL_RANK: Record<FamilyFunctionalCareLevel, number> = {
  independent: 0,
  "iadl-support": 1,
  "adl-support": 2,
  "high-dependence": 3,
  "advanced-dementia": 4,
};

function currentScale(scales: readonly AgaScaleReportSection[], code: string): AgaScaleReportSection | undefined {
  return scales.find((scale) => scale.code === code && scale.assessedInTargetConsultation);
}

function maxLevel(current: FamilyFunctionalCareLevel, candidate: FamilyFunctionalCareLevel): FamilyFunctionalCareLevel {
  return LEVEL_RANK[candidate] > LEVEL_RANK[current] ? candidate : current;
}

function fastStageLabel(score: number): string {
  const known: Record<string, string> = {
    "6.1": "6a",
    "6.2": "6b",
    "6.3": "6c",
    "6.4": "6d",
    "6.5": "6e",
    "7.1": "7a",
    "7.2": "7b",
    "7.3": "7c",
    "7.4": "7d",
    "7.5": "7e",
    "7.6": "7f",
  };
  return known[String(score)] ?? String(score);
}

function fastLevel(score: number): FamilyFunctionalCareLevel {
  if (score >= 7) return "advanced-dementia";
  if (score >= 6) return "high-dependence";
  if (score >= 5) return "adl-support";
  if (score >= 4) return "iadl-support";
  return "independent";
}

function katzLevel(score: number): FamilyFunctionalCareLevel {
  if (score <= 2) return "high-dependence";
  if (score <= 5) return "adl-support";
  return "independent";
}

function barthelLevel(score: number): FamilyFunctionalCareLevel {
  if (score <= 35) return "high-dependence";
  if (score <= 95) return "adl-support";
  return "independent";
}

function lawtonLevel(score: number): FamilyFunctionalCareLevel {
  return score < 21 ? "iadl-support" : "independent";
}

/**
 * Define o nível de apoio que contextualiza as orientações familiares.
 * Hierarquia clínica deliberada:
 * 1. FAST é a primeira âncora e determina a gravidade funcional associada à demência.
 * 2. Katz e Barthel acrescentam a necessidade de ajuda nas ABVD, sem reduzir nem contradizer
 *    uma limitação já estabelecida por outro instrumento funcional.
 * 3. Lawton acrescenta dependência nas AIVD, sem reduzir uma dependência previamente identificada.
 *
 * O contexto apenas adapta linguagem e prioridades de cuidado. Não cria diagnóstico,
 * não altera pontuação de escala e não gera prescrição.
 */
export function deriveFamilyFunctionalContext(
  scales: readonly AgaScaleReportSection[],
): FamilyFunctionalContext {
  const fast = currentScale(scales, "fast");
  const katz = currentScale(scales, "katz");
  const barthel = currentScale(scales, "barthel");
  const lawton = currentScale(scales, "lawton");

  const fastScore = fast?.result.score ?? undefined;
  const katzScore = katz?.result.score ?? undefined;
  const barthelScore = barthel?.result.score ?? undefined;
  const lawtonScore = lawton?.result.score ?? undefined;

  let level: FamilyFunctionalCareLevel = "independent";
  const sources: string[] = [];

  if (typeof fastScore === "number") {
    level = maxLevel(level, fastLevel(fastScore));
    sources.push(`FAST ${fastStageLabel(fastScore)}`);
  }
  if (typeof katzScore === "number") {
    level = maxLevel(level, katzLevel(katzScore));
    sources.push(`Katz ${katzScore}`);
  }
  if (typeof barthelScore === "number") {
    level = maxLevel(level, barthelLevel(barthelScore));
    sources.push(`Barthel ${barthelScore}`);
  }
  if (typeof lawtonScore === "number") {
    level = maxLevel(level, lawtonLevel(lawtonScore));
    sources.push(`Lawton ${lawtonScore}`);
  }

  return {
    level,
    sourceSummary: sources.length > 0 ? sources.join(" · ") : "Funcionalidade não estratificada por FAST, Katz, Barthel ou Lawton nesta consulta",
    ...(typeof fastScore === "number" ? { fastScore, fastStage: fastStageLabel(fastScore) } : {}),
    ...(typeof katzScore === "number" ? { katzScore } : {}),
    ...(typeof barthelScore === "number" ? { barthelScore } : {}),
    ...(typeof lawtonScore === "number" ? { lawtonScore } : {}),
  };
}

const ADVANCED_DEMENTIA_GUIDANCE: Readonly<Record<string, readonly string[]>> = {
  funcionalidade: [
    "O estágio funcional indica dependência muito avançada. Organize o cuidado para assistência integral nas atividades básicas, priorizando conforto, segurança e dignidade; não se espera que a pessoa realize tarefas sozinha.",
    "Nas transferências, mudanças de posição, higiene e cuidados no leito ou na cadeira, use a ajuda humana e os recursos já orientados pela equipe, evitando manobras improvisadas.",
    "Observe diariamente pele, áreas de pressão, dor durante a mobilização e desconforto com a posição; comunique feridas, vermelhidão persistente ou dor nova à equipe.",
    "Mudança súbita em vigília, interação, mobilidade ou tolerância aos cuidados deve ser considerada alteração do estado habitual e comunicada precocemente.",
  ],
  cognicao: [
    "Em demência avançada, use comunicação simples, calma e afetiva. Dê preferência a frases curtas, contato visual, toque quando bem tolerado e leitura de sinais não verbais de dor, medo ou desconforto.",
    "Mantenha rotina previsível e ambiente familiar, mas sem exigir orientação temporal, memória ou execução independente de tarefas que já não correspondem ao estágio funcional.",
    "O cuidador deve assumir a organização de medicamentos, compromissos e decisões práticas do dia a dia conforme os acordos já definidos com a família e a equipe.",
    "Confusão ou sonolência de início recente, agitação muito diferente do padrão habitual ou redução abrupta da interação merece avaliação clínica.",
  ],
  mobilidade: [
    "Na demência avançada, adapte a mobilidade ao desempenho funcional já estabelecido. Use assistência compatível com a capacidade atual e não proponha marcha independente quando ela já não fizer parte do desempenho habitual.",
    "Mude a posição e realize mobilização apenas conforme tolerância e orientações já recebidas, observando dor, falta de ar, fadiga e segurança do cuidador.",
    "Mantenha o ambiente livre para permitir aproximação segura do cuidador e dos equipamentos de apoio já utilizados.",
  ],
  nutricao: [
    "Ofereça alimentação e líquidos com supervisão compatível com o grau de dependência e com as orientações de consistência e posicionamento já definidas pela equipe.",
    "Observe tosse, engasgos, voz molhada após engolir, refeições muito prolongadas, recusa persistente ou redução importante da ingestão e comunique essas mudanças à equipe.",
    "Priorize conforto, ritmo lento e boa aceitação, sem forçar ingestão quando houver desconforto ou dificuldade evidente.",
  ],
  fragilidade: [
    "A vulnerabilidade deve ser interpretada junto da dependência avançada: priorize prevenção de quedas durante transferências, proteção da pele, conforto, sono e reconhecimento precoce de intercorrências.",
    "Evite metas genéricas de exercício independente quando elas não forem compatíveis com o estágio funcional; siga somente mobilização e atividades já consideradas seguras pela equipe.",
  ],
  "suporte-social": [
    "Distribua tarefas do cuidado entre as pessoas disponíveis e deixe claro quem responde por higiene, alimentação, medicações, mudanças de posição, consultas e contatos com a equipe.",
    "Planeje descanso e substituição periódica do cuidador principal. Sobrecarga, exaustão ou dificuldade para realizar transferências e higiene com segurança devem ser comunicadas à equipe.",
    "Nas conversas com a equipe, alinhe prioridades de cuidado, conforto e decisões futuras com a família e com as preferências previamente conhecidas da pessoa.",
  ],
  medicamentos: [
    "Mantenha a lista de medicamentos e horários sob responsabilidade de um cuidador definido, levando a lista atualizada a consultas, urgências e internações.",
    "Não inicie, suspenda, substitua ou ajuste medicamentos por conta própria. Sonolência nova, quedas nas transferências, sangramento, hipoglicemia ou dificuldade de administração devem ser comunicados à equipe.",
  ],
  sensorial: [
    "Favoreça conforto e reconhecimento com voz familiar, iluminação suave e recursos visuais ou auditivos habituais quando forem bem tolerados.",
    "Não exija respostas verbais ou desempenho em tarefas para avaliar bem-estar; observe expressão facial, postura, vocalizações e mudanças de comportamento.",
  ],
};

const HIGH_DEPENDENCE_GUIDANCE: Readonly<Record<string, readonly string[]>> = {
  funcionalidade: [
    "Há dependência importante para atividades básicas. Planeje quem ajuda em banho, vestir-se, higiene, alimentação e transferências, evitando deixar tarefas de risco sem supervisão.",
    "Adapte o nível de participação ao que a pessoa ainda consegue fazer de forma segura, sem transformar preservação de autonomia em obrigação ou risco.",
    "Observe aumento da necessidade de ajuda, dor nas transferências, nova perda de mobilidade e alterações de pele e comunique à equipe.",
  ],
  cognicao: [
    "Use instruções curtas e uma etapa por vez. Quando a dependência já é importante, o cuidador deve assumir tarefas de segurança como medicamentos, finanças e organização de consultas.",
    "Mantenha rotina previsível e reduza exigências que provoquem frustração, oferecendo escolhas simples quando isso for possível e seguro.",
  ],
  mobilidade: [
    "Priorize transferências seguras, supervisão ao levantar e uso correto dos apoios já indicados. Não estimule marcha sem a assistência necessária.",
    "Registre quedas, quase quedas e situações em que o cuidador passou a precisar de mais ajuda para mobilizar a pessoa.",
  ],
};

const ADL_SUPPORT_GUIDANCE: Readonly<Record<string, readonly string[]>> = {
  funcionalidade: [
    "Defina claramente em quais atividades básicas a pessoa precisa de supervisão ou ajuda física e mantenha independência apenas nas etapas que continuam seguras.",
    "Evite fazer tudo pela pessoa quando ela ainda consegue participar, mas não deixe sem ajuda atividades com risco de queda, erro de medicação, higiene inadequada ou alimentação insegura.",
    "Anote quais atividades passaram a exigir mais ajuda desde a última consulta para facilitar a revisão longitudinal.",
  ],
  cognicao: [
    "Associe orientações cognitivas ao desempenho funcional real: use lembretes e rotina para o que ainda é possível, e transfira ao cuidador as tarefas que já apresentam risco ou erros repetidos.",
  ],
};

const IADL_SUPPORT_GUIDANCE: Readonly<Record<string, readonly string[]>> = {
  funcionalidade: [
    "Concentre o apoio nas atividades instrumentais que já apresentam dificuldade, como finanças, compras, transporte, organização da casa e medicamentos, preservando as atividades básicas que permanecem seguras.",
    "Use supervisão proporcional ao risco e revise periodicamente se novas tarefas passaram a exigir ajuda.",
  ],
  cognicao: [
    "Use listas, rotina, calendário e supervisão nas tarefas complexas. Se houver erros em finanças, medicamentos ou deslocamentos, não dependa apenas de lembretes: organize apoio direto do cuidador.",
  ],
};

/**
 * Substitui orientação genérica por orientação coerente com o grau de dependência.
 * Para FAST 7.x, a linguagem é deliberadamente centrada em cuidado integral,
 * conforto e prevenção de complicações, evitando recomendações de autonomia incompatíveis.
 * FAST 7c ou superior recebe, em seguida, a orientação específica de imobilidade.
 */
export function contextualFamilyGuidance(
  dimension: string,
  baseGuidance: readonly string[],
  context: FamilyFunctionalContext,
): string[] {
  const contextual = context.level === "advanced-dementia"
    ? ADVANCED_DEMENTIA_GUIDANCE[dimension]
    : context.level === "high-dependence"
      ? HIGH_DEPENDENCE_GUIDANCE[dimension]
      : context.level === "adl-support"
        ? ADL_SUPPORT_GUIDANCE[dimension]
        : context.level === "iadl-support"
          ? IADL_SUPPORT_GUIDANCE[dimension]
          : undefined;

  if (!contextual?.length) return [...baseGuidance];
  return [...contextual];
}

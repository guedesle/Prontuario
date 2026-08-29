export interface ContextScaleInput {
  code: string;
  assessedInTargetConsultation: boolean;
  result: { score: number | null };
}

export interface ContextProblemInput {
  title: string;
  status: string;
}

export interface ContextMedicationInput {
  route?: string;
  status?: string;
}

export type ImmobilitySource = "FAST_7C_OR_HIGHER" | "GERIATRIC_PROBLEM";

export interface EstablishedImmobilityContext {
  established: boolean;
  source?: ImmobilitySource;
  fastScore?: number;
  fastStage?: string;
}

export interface ContextualFamilyCareGuidance {
  now: string[];
  caregiver: string[];
  contact: string[];
}

function normalized(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

function fastStageLabel(score: number): string {
  const known: Record<string, string> = {
    "7.3": "7c",
    "7.4": "7d",
    "7.5": "7e",
    "7.6": "7f",
  };
  return known[String(score)] ?? String(score);
}

function activeImmobilityProblem(problems: readonly ContextProblemInput[]): boolean {
  return problems.some((problem) =>
    problem.status !== "RESOLVED" && normalized(problem.title) === "imobilidade"
  );
}

/**
 * Regra de precedência do relatório familiar:
 * 1. FAST 7c ou superior define imobilidade associada ao estágio da demência.
 * 2. Na ausência desse gatilho, o problema geriátrico Imobilidade também ativa os mesmos
 *    cuidados práticos, sem inferir ou modificar a classificação FAST.
 */
export function deriveEstablishedImmobilityContext(input: {
  scales: readonly ContextScaleInput[];
  geriatricProblems?: readonly ContextProblemInput[];
}): EstablishedImmobilityContext {
  const fast = input.scales.find((scale) => scale.code === "fast" && scale.assessedInTargetConsultation);
  const fastScore = fast?.result.score ?? undefined;

  if (typeof fastScore === "number" && fastScore >= 7.3) {
    return {
      established: true,
      source: "FAST_7C_OR_HIGHER",
      fastScore,
      fastStage: fastStageLabel(fastScore),
    };
  }

  if (activeImmobilityProblem(input.geriatricProblems ?? [])) {
    return { established: true, source: "GERIATRIC_PROBLEM" };
  }

  return { established: false };
}

function mobilityOpening(context: EstablishedImmobilityContext): string {
  if (context.source === "FAST_7C_OR_HIGHER") {
    if ((context.fastScore ?? 0) >= 7.4) {
      return `O FAST ${context.fastStage ?? "7d"} indica perda da deambulação e incapacidade de manter-se sentado sem apoio. O foco do cuidado é posicionamento seguro, transferências assistidas e prevenção das complicações da imobilidade; não se estabelece meta de marcha independente.`;
    }
    return "O FAST 7c indica perda da capacidade de deambular de forma independente. O foco do cuidado é mobilidade assistida, transferências seguras e prevenção das complicações da imobilidade; não se estabelece meta de marcha independente.";
  }

  return "A imobilidade está registrada como problema geriátrico. O foco do cuidado é posicionamento seguro, mobilidade e transferências assistidas e prevenção das complicações da imobilidade; não se estabelece meta de marcha independente enquanto esse problema permanecer ativo.";
}

export function establishedImmobilityGuidance(
  context: EstablishedImmobilityContext,
): ContextualFamilyCareGuidance {
  if (!context.established) return { now: [], caregiver: [], contact: [] };

  return {
    now: [
      mobilityOpening(context),
      "Realize mudanças de posição e mobilização de acordo com a tolerância e com as orientações já recebidas da equipe, observando dor, falta de ar, fadiga ou desconforto.",
      "Observe diariamente a pele e as áreas de pressão, especialmente regiões em contato prolongado com cama, cadeira ou dispositivos de apoio.",
    ],
    caregiver: [
      "Nas transferências e cuidados no leito ou na cadeira, utilize a ajuda humana e os recursos de apoio já orientados pela equipe; evite manobras improvisadas que coloquem paciente ou cuidador em risco.",
      "Organize o ambiente para permitir aproximação segura do cuidador e dos equipamentos de apoio utilizados no dia a dia.",
    ],
    contact: [
      "Comunique à equipe nova dor durante mobilização, vermelhidão persistente, feridas, piora súbita da tolerância às transferências ou mudança importante do padrão habitual de mobilidade.",
    ],
  };
}

export function contextualizeImmobilityDomainGuidance(
  dimension: string,
  baseGuidance: readonly string[],
  context: EstablishedImmobilityContext | undefined,
): string[] {
  if (!context?.established || (dimension !== "mobilidade" && dimension !== "funcionalidade")) {
    return [...baseGuidance];
  }

  const guidance = establishedImmobilityGuidance(context);
  return [...guidance.now, ...guidance.caregiver];
}

export function hasGastrostomyMedicationRoute(items: readonly ContextMedicationInput[]): boolean {
  return items.some((item) => {
    if (item.status && item.status !== "ACTIVE") return false;
    const route = normalized(item.route ?? "");
    return route === "gtt"
      || route === "via gtt"
      || route.includes("gastrostomia")
      || /\bpeg\b/.test(route);
  });
}

/**
 * Orientações educativas para quem já possui gastrostomia registrada.
 * Não define fórmula, volume, velocidade, oferta hídrica ou preparo específico de medicamentos;
 * esses parâmetros dependem da prescrição e da avaliação individual.
 */
export function gastrostomyFamilyGuidance(): ContextualFamilyCareGuidance {
  return {
    now: [
      "Higienize as mãos antes de manipular a gastrostomia, a dieta, a água ou os medicamentos e mantenha as conexões e utensílios limpos conforme o treinamento recebido.",
      "Administre a dieta enteral conforme o plano já definido pela equipe, respeitando fórmula, volume, velocidade, horários e oferta de água individualizados; não faça mudanças por conta própria.",
      "Durante a administração da dieta, mantenha o paciente adequadamente posicionado e com a cabeceira elevada conforme orientação da equipe, mantendo o posicionamento após a dieta pelo período orientado para reduzir risco de refluxo e aspiração.",
      "Faça a lavagem da sonda com água antes e depois da dieta e dos medicamentos, e entre medicamentos diferentes, usando o volume de água individualmente orientado pela equipe; restrição de líquidos e características da sonda podem exigir volumes diferentes.",
    ],
    caregiver: [
      "Administre os medicamentos separadamente e não os misture diretamente à fórmula da dieta. Confirme se cada medicamento e apresentação podem ser usados pela gastrostomia.",
      "Não triture comprimidos ou abra cápsulas sem confirmação profissional: formas de liberação modificada, revestimento entérico e outras apresentações podem não ser seguras ou adequadas para administração pela sonda.",
      "Mantenha a pele ao redor do estoma limpa e seca e observe diariamente vermelhidão persistente, inchaço, dor, secreção, sangramento ou vazamento de conteúdo ao redor da gastrostomia.",
      "Se houver resistência para lavar ou administrar conteúdo pela sonda, não force a passagem. Utilize apenas as medidas de desobstrução que tenham sido previamente ensinadas pela equipe.",
    ],
    contact: [
      "Entre em contato com a equipe se houver obstrução persistente, vazamento importante, dor nova, sangramento, secreção, piora da pele ao redor do estoma, vômitos recorrentes ou intolerância à dieta.",
      "Se a gastrostomia deslocar ou sair, procure orientação assistencial imediatamente e não tente recolocá-la sem treinamento e orientação específicos.",
    ],
  };
}

export function uniqueContextualGuidance(items: readonly string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

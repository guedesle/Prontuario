import type { ClinicalColor } from "./clinical-engine.ts";

export type IntrinsicCapacityDomainCode =
  | "locomocao"
  | "cognicao"
  | "psicologico"
  | "vitalidade"
  | "sensorial";

export interface IntrinsicCapacityGuidanceSection {
  code: IntrinsicCapacityDomainCode;
  label: string;
  whyItMatters: string;
  triggeredBy: string[];
  actions: string[];
  attentionSigns: string[];
}

export interface IntrinsicCapacityGuidance {
  framework: "WHO intrinsic capacity — five domains";
  sourceLabel: string;
  alteredDomains: IntrinsicCapacityGuidanceSection[];
}

interface AssessmentSignal {
  scaleId: string;
  scaleName: string;
  color?: ClinicalColor;
  assessedInTargetConsultation: boolean;
}

const DOMAIN_ORDER: readonly IntrinsicCapacityDomainCode[] = [
  "locomocao",
  "cognicao",
  "psicologico",
  "vitalidade",
  "sensorial",
];

const SCALE_DOMAINS: Readonly<Record<string, readonly IntrinsicCapacityDomainCode[]>> = {
  katz: ["locomocao"],
  lawton: ["locomocao"],
  barthel: ["locomocao"],
  pfeffer: ["locomocao", "cognicao"],
  pfeffer10: ["locomocao", "cognicao"],
  sppb: ["locomocao"],
  poma: ["locomocao"],
  sarcf: ["locomocao"],
  preensao: ["locomocao"],
  velocidade_marcha: ["locomocao"],
  sentar_levantar_5x: ["locomocao"],
  moca: ["cognicao"],
  meem: ["cognicao"],
  dez_cs: ["cognicao"],
  cam: ["cognicao"],
  fast: ["cognicao"],
  minicog_freitas: ["cognicao"],
  clock_shulman: ["cognicao"],
  moca_br_freitas: ["cognicao"],
  iqcode_br_26: ["cognicao"],
  gds15: ["psicologico"],
  cornell: ["psicologico"],
  cesd_br_elderly: ["psicologico"],
  mna_sf: ["vitalidade"],
  frail_br: ["locomocao", "vitalidade"],
  audicao: ["sensorial"],
  hearing: ["sensorial"],
  visao: ["sensorial"],
  vision: ["sensorial"],
};

const DOMAIN_CONTENT: Readonly<Record<IntrinsicCapacityDomainCode, Omit<IntrinsicCapacityGuidanceSection, "code" | "triggeredBy">>> = {
  locomocao: {
    label: "Locomoção",
    whyItMatters: "Reúne força, equilíbrio, marcha e capacidade de realizar atividades com segurança.",
    actions: [
      "Mantenha corredores e o caminho até o banheiro livres, bem iluminados e sem tapetes soltos.",
      "Use bengala, andador, corrimão ou supervisão somente do modo já orientado pela equipe; deixe o apoio ao alcance antes de levantar.",
      "Faça apenas os exercícios e caminhadas que já foram considerados seguros, com companhia quando houver risco de queda.",
      "Anote quedas, quase quedas e atividades que passaram a exigir ajuda para contar à equipe.",
    ],
    attentionSigns: [
      "Avise a equipe se houver nova queda, piora progressiva para caminhar ou necessidade crescente de ajuda.",
      "Procure atendimento imediato após queda com trauma importante ou se surgir incapacidade súbita de ficar em pé ou mover um membro.",
    ],
  },
  cognicao: {
    label: "Cognição",
    whyItMatters: "Inclui memória, orientação, atenção, comunicação e capacidade de organizar tarefas do dia a dia.",
    actions: [
      "Mantenha rotina previsível, calendário e relógio visíveis; antecipe mudanças com frases curtas.",
      "Dê uma orientação por vez, confirme que foi compreendida e ofereça tempo para a resposta.",
      "Organize compromissos, finanças e medicamentos com o apoio do cuidador no nível de supervisão definido pela equipe.",
      "Garanta iluminação adequada e que óculos e aparelhos auditivos habituais estejam disponíveis e funcionando.",
    ],
    attentionSigns: [
      "Avise a equipe se esquecimentos começarem a comprometer alimentação, higiene, segurança, dinheiro ou uso correto dos medicamentos.",
      "Confusão de início súbito, sonolência incomum, agitação nova ou grande flutuação ao longo do dia requer avaliação urgente.",
    ],
  },
  psicologico: {
    label: "Capacidade psicológica",
    whyItMatters: "Abrange humor, motivação, ansiedade, sono, interesse e participação social.",
    actions: [
      "Combine horários regulares para acordar, refeições e sono, evitando isolamento prolongado durante o dia.",
      "Planeje diariamente uma atividade simples e significativa escolhida pelo paciente, sem cobrança por desempenho.",
      "Mantenha contato frequente com pessoas de confiança e escute mudanças de humor sem minimizar o relato.",
      "Registre por alguns dias alterações de sono, apetite, ansiedade, interesse e participação para discutir com a equipe.",
    ],
    attentionSigns: [
      "Avise a equipe se tristeza, ansiedade, apatia, irritabilidade ou recusa de atividades persistirem ou piorarem.",
      "Fala sobre morte, desesperança intensa, intenção de se machucar ou risco para outras pessoas exige ajuda imediata.",
    ],
  },
  vitalidade: {
    label: "Vitalidade",
    whyItMatters: "Reflete energia, reservas do organismo, nutrição e capacidade de recuperação diante de doenças.",
    actions: [
      "Ofereça refeições menores em horários regulares e alimentos bem aceitos dentro das orientações alimentares já definidas.",
      "Facilite água e outras bebidas permitidas ao longo do dia, respeitando eventual restrição de líquidos informada pela equipe.",
      "Acompanhe peso na mesma balança e observe roupas mais folgadas, redução das porções ou dificuldade para mastigar e engolir.",
      "Alterne atividade e descanso, preservando participação nas tarefas que o paciente consegue fazer com segurança.",
    ],
    attentionSigns: [
      "Avise a equipe sobre perda de peso, redução persistente da ingestão, cansaço crescente, vômitos ou dificuldade para engolir.",
      "Procure avaliação rápida se houver engasgo com falta de ar, incapacidade de ingerir líquidos ou sinais de desidratação e prostração importante.",
    ],
  },
  sensorial: {
    label: "Capacidade sensorial",
    whyItMatters: "Visão e audição sustentam comunicação, orientação, mobilidade e participação social.",
    actions: [
      "Use iluminação uniforme, contraste nos degraus e objetos de uso diário sempre no mesmo local.",
      "Reduza ruído de fundo, fale de frente para o paciente e confirme a mensagem sem gritar.",
      "Limpe, carregue e guarde óculos e aparelhos auditivos conforme a rotina habitual; observe se deixaram de funcionar bem.",
      "Leve óculos, aparelhos e lista de dificuldades às avaliações de visão ou audição já programadas.",
    ],
    attentionSigns: [
      "Avise a equipe se a dificuldade para ver ou ouvir estiver aumentando quedas, isolamento ou erros nas tarefas diárias.",
      "Perda súbita de visão ou audição, dor ocular intensa ou novo sintoma neurológico requer avaliação urgente.",
    ],
  },
};

function isAltered(color: ClinicalColor | undefined): boolean {
  return color === "amarelo" || color === "vermelho";
}

export function buildIntrinsicCapacityGuidance(
  assessments: readonly AssessmentSignal[],
): IntrinsicCapacityGuidance {
  const triggers = new Map<IntrinsicCapacityDomainCode, Set<string>>();

  for (const assessment of assessments) {
    if (!assessment.assessedInTargetConsultation || !isAltered(assessment.color)) continue;
    for (const domain of SCALE_DOMAINS[assessment.scaleId] ?? []) {
      const names = triggers.get(domain) ?? new Set<string>();
      names.add(assessment.scaleName);
      triggers.set(domain, names);
    }
  }

  return {
    framework: "WHO intrinsic capacity — five domains",
    sourceLabel: "OMS — Década do Envelhecimento Saudável: locomoção, capacidade sensorial, vitalidade, cognição e capacidade psicológica.",
    alteredDomains: DOMAIN_ORDER.flatMap((code) => {
      const names = triggers.get(code);
      if (!names?.size) return [];
      const content = DOMAIN_CONTENT[code];
      return [{
        code,
        label: content.label,
        whyItMatters: content.whyItMatters,
        triggeredBy: [...names],
        actions: [...content.actions],
        attentionSigns: [...content.attentionSigns],
      }];
    }),
  };
}

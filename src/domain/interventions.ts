import type { ClinicalColor } from "./clinical-engine.ts";

export interface InterventionPlan {
  agora: string[];
  medio: string[];
  cuidador: string[];
  encaminhamentos: string[];
  contato: string[];
  urgencia: string[];
}

export type InterventionFragment = Partial<InterventionPlan>;
export type InterventionByColor = Partial<
  Record<Exclude<ClinicalColor, "cinza">, InterventionFragment>
>;

function unique(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of items) {
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}

export function emptyInterventionPlan(): InterventionPlan {
  return {
    agora: [],
    medio: [],
    cuidador: [],
    encaminhamentos: [],
    contato: [],
    urgencia: [],
  };
}

export function mergeInterventionPlans(
  ...fragments: InterventionFragment[]
): InterventionPlan {
  const base = emptyInterventionPlan();
  for (const fragment of fragments) {
    for (const key of Object.keys(base) as (keyof InterventionPlan)[]) {
      base[key].push(...(fragment[key] ?? []));
    }
  }
  for (const key of Object.keys(base) as (keyof InterventionPlan)[]) {
    base[key] = unique(base[key]);
  }
  return base;
}

/**
 * Primeira extração validada do objeto INTERVENCOES do legado.
 * A engine de cálculo não conhece estas orientações; a separação é deliberada.
 */
export const LEGACY_INTERVENTIONS: Record<string, InterventionByColor> = {
  lawton: {
    vermelho: {
      agora: [
        "Assumir em conjunto o controle das contas e dos medicamentos, mantendo o paciente informado das decisões.",
        "Organizar os remédios em caixa semanal (segunda a domingo, manhã/tarde/noite), preparada por um familiar.",
      ],
      medio: ["Terapia ocupacional para adaptar tarefas domésticas e treinar rotinas com apoio."],
      cuidador: ["Escrever a rotina do dia em uma folha grande fixada na cozinha: horários dos remédios, refeições e caminhada."],
      encaminhamentos: ["Terapia ocupacional", "Serviço social"],
    },
    amarelo: {
      agora: ["Simplificar o que já está difícil: caixa semanal de remédios, débito automático das contas fixas e lista de compras pronta."],
      medio: ["Reavaliar em 3 meses quais atividades continuam sendo feitas sozinho, para detectar perdas novas cedo."],
      encaminhamentos: ["Terapia ocupacional"],
    },
  },
  pfeffer: {
    vermelho: {
      agora: [
        "Não deixar o paciente responsável sozinho por fogão, dinheiro e medicamentos até nova reavaliação.",
        "Avaliar a segurança de sair sozinho de casa; se houver risco de se perder, providenciar identificação com nome e telefone no bolso ou pulseira.",
      ],
      medio: ["Investigação de causa do declínio funcional e reabilitação cognitiva."],
      cuidador: ["Manter a rotina previsível e o ambiente organizado — mudanças bruscas de rotina pioram a confusão."],
      encaminhamentos: ["Terapia ocupacional", "Neuropsicologia"],
    },
    amarelo: {
      agora: ["Supervisionar de perto o uso dos medicamentos e o manejo do dinheiro."],
      encaminhamentos: ["Terapia ocupacional"],
    },
  },
  barthel: {
    vermelho: {
      agora: [
        "Prevenir lesão por pressão: mudança de posição a cada 2 horas quando acamado, hidratação da pele e colchão adequado.",
        "Adequar a cama e a cadeira à altura que facilite a transferência.",
      ],
      medio: ["Programa de reabilitação motora contínuo, com metas funcionais definidas por escrito."],
      cuidador: ["Aprender com o fisioterapeuta a técnica correta de transferência — protege as costas do cuidador e evita quedas."],
      encaminhamentos: ["Fisioterapia", "Terapia ocupacional", "Enfermagem"],
    },
    amarelo: {
      agora: ["Adaptar o ambiente para preservar a independência nas atividades que ainda são feitas sozinho."],
      encaminhamentos: ["Fisioterapia"],
    },
  },
  g8: {
    vermelho: {
      agora: ["Rastreio positivo: está indicada a Avaliação Geriátrica Ampla completa antes de definir o tratamento oncológico."],
      medio: ["Reavaliar durante o tratamento, pois o estado de saúde muda ao longo dos ciclos."],
      encaminhamentos: ["Geriatria / Oncogeriatria"],
    },
  },
  apgar_familiar: {
    vermelho: {
      agora: [
        "Identificar uma pessoa de referência que possa acompanhar as consultas e ajudar na organização do cuidado.",
        "Avaliação com serviço social para mapear a rede disponível e os benefícios a que o paciente tem direito.",
      ],
      medio: ["Considerar grupos de convivência, centro-dia ou atividades comunitárias para reduzir o isolamento."],
      encaminhamentos: ["Serviço social", "Psicologia"],
      contato: ["Sobrecarga da família ou dificuldade em manter o cuidado combinado."],
      urgencia: ["Suspeita de maus-tratos, negligência, violência ou abuso financeiro: Disque 100 (24 horas, gratuito) ou Delegacia do Idoso."],
    },
    amarelo: {
      agora: ["Conversar em família sobre a divisão das tarefas de cuidado."],
      encaminhamentos: ["Serviço social"],
    },
  },
  zarit_reduzida: {
    vermelho: {
      agora: [
        "O cuidador precisa de pausa programada: pelo menos meio dia por semana livre, com substituição combinada previamente.",
        "Dividir formalmente as tarefas entre os familiares, por escrito.",
      ],
      medio: [
        "Apoio psicológico ao cuidador e participação em grupo de apoio.",
        "Avaliar cuidador formal, centro-dia ou serviço de apoio domiciliar.",
      ],
      cuidador: ["Cuidar de si não é abandono. Um cuidador esgotado adoece e o cuidado piora para os dois."],
      encaminhamentos: ["Psicologia", "Serviço social"],
    },
    amarelo: {
      agora: ["Programar pausas regulares e dividir tarefas entre os familiares."],
      encaminhamentos: ["Serviço social"],
    },
  },
  charlson: {
    vermelho: {
      agora: [
        "Otimizar o controle de cada doença crônica antes de procedimentos ou tratamentos de maior porte.",
        "Levar a lista atualizada de doenças e medicamentos a todas as consultas e ao pronto-socorro.",
      ],
      medio: ["Definir com o médico as prioridades de tratamento e as metas de cuidado, considerando o conjunto das doenças e não cada uma isoladamente."],
      encaminhamentos: ["Coordenação de cuidado interdisciplinar"],
    },
    amarelo: {
      agora: ["Manter o acompanhamento regular de cada condição crônica."],
      encaminhamentos: [],
    },
  },
  ves13: {
    vermelho: {
      agora: ["Rastreio positivo para vulnerabilidade: indicada avaliação geriátrica completa e plano de cuidado individualizado."],
      encaminhamentos: ["Geriatria / Oncogeriatria"],
    },
  },
  mna_sf: {
    vermelho: {
      agora: [
        "Fracionar a alimentação: 5 a 6 refeições menores por dia, em vez de 3 grandes.",
        "Incluir uma fonte de proteína em todas as refeições (ovo, carne, frango, peixe, queijo, leite, feijão).",
        "Não usar dietas restritivas (sem sal, sem açúcar, sem gordura) sem indicação médica — em idoso com risco nutricional elas fazem mais mal que bem.",
      ],
      medio: [
        "Avaliação com nutricionista para plano individualizado e decisão sobre suplemento.",
        "Avaliação odontológica se houver dor ao mastigar ou prótese mal adaptada.",
      ],
      cuidador: ["Servir os alimentos preferidos, com boa aparência e temperatura agradável. Comer acompanhado aumenta a ingestão."],
      encaminhamentos: ["Nutrição", "Odontologia", "Fonoaudiologia"],
      contato: [
        "Engasgo frequente, tosse durante as refeições ou voz molhada depois de beber água.",
        "Recusa alimentar por mais de dois dias seguidos.",
      ],
    },
    amarelo: {
      agora: ["Pesar o paciente uma vez por mês, sempre na mesma balança e no mesmo horário, e anotar em um caderno."],
      medio: ["Avaliação nutricional preventiva."],
      encaminhamentos: ["Nutrição"],
      contato: ["Perda de peso continuada apesar das orientações."],
    },
  },
  polifarmacia: {
    vermelho: {
      agora: [
        "Trazer TODAS as caixas de remédio, incluindo os que não foram receitados, vitaminas e chás, na próxima consulta — inclusive os que 'já não toma mais'.",
        "Organizar os medicamentos em caixa semanal com divisões por horário.",
        "Não suspender nada por conta própria: a retirada precisa ser feita com o médico, uma medicação por vez.",
      ],
      medio: [
        "Revisão formal da prescrição com desprescrição planejada e, quando disponível, apoio de farmacêutico clínico.",
        "Reavaliar as doses conforme a função dos rins e do fígado.",
      ],
      cuidador: ["Manter uma lista atualizada dos medicamentos no celular e uma cópia impressa na bolsa, para levar a qualquer atendimento."],
      encaminhamentos: ["Farmácia clínica"],
      contato: [
        "Tontura ao levantar, quedas, sonolência excessiva ou confusão nova — podem ser efeito de medicamento. Não aumente nenhuma dose por conta própria.",
        "Qualquer medicamento novo prescrito por outro profissional.",
      ],
    },
    amarelo: {
      agora: ["Revisar a lista completa de medicamentos na próxima consulta e simplificar horários sempre que possível."],
    },
  },
  sarcf: {
    vermelho: {
      agora: [
        "Iniciar treino de força (exercício resistido) para membros superiores e inferiores, 2 a 3 vezes por semana, com carga progressiva — é a intervenção com maior evidência de benefício em sarcopenia (EWGSOP2).",
        "Se ainda não realizados nesta avaliação, confirmar com força de preensão palmar ou teste de sentar-levantar 5 vezes.",
      ],
      medio: [
        "Avaliação nutricional com ingestão de proteína em torno de 1,0 a 1,2 g por quilo de peso ao dia (ajustar se houver doença renal), e dosagem de vitamina D com reposição se deficiente.",
        "Investigar causas secundárias — inatividade física, doença inflamatória, neoplasia, insuficiência de órgão ou doença neurológica — já que a sarcopenia pode sinalizar outra condição de base, além do envelhecimento isolado (EWGSOP2).",
        "Se disponível, considerar avaliação de massa muscular (DXA ou bioimpedância) e de desempenho físico (velocidade de marcha ou SPPB) para confirmar o diagnóstico e classificar a gravidade.",
      ],
      cuidador: [
        "Estimular caminhadas e atividades que exijam força (levantar, carregar objetos leves) no dia a dia, sem forçar além da tolerância — e ficar atento a quedas, que se tornam mais prováveis com a sarcopenia.",
      ],
      encaminhamentos: ["Fisioterapia", "Nutrição"],
    },
  },
  velocidade_marcha: {
    vermelho: {
      agora: [
        "Caminhar 20 minutos, 5 vezes por semana, em piso plano e com calçado fechado, de solado fino e antiderrapante. Se 20 minutos for muito, começar com 10 e aumentar 2 minutos por semana.",
      ],
      medio: [
        "Treino de força de pernas (agachamento apoiado na cadeira, subir degrau) 2 vezes por semana, orientado por fisioterapeuta ou educador físico.",
      ],
      encaminhamentos: ["Fisioterapia", "Educador físico"],
      contato: ["Piora rápida da caminhada em poucas semanas, sem explicação."],
    },
    amarelo: {
      agora: ["Manter caminhada regular de 20 a 30 minutos, 5 vezes por semana."],
      encaminhamentos: ["Educador físico"],
    },
  },
  sentar_levantar_5x: {
    vermelho: {
      agora: [
        "Exercício de levantar e sentar da cadeira: 3 séries de 8 repetições, 3 vezes por semana, com a cadeira encostada na parede e alguém por perto nas primeiras semanas.",
      ],
      medio: [
        "Treino de força resistido supervisionado 2 a 3 vezes por semana.",
        "Garantir ingestão de proteína em todas as refeições (carne, ovo, leite, queijo, feijão), conforme orientação do nutricionista.",
      ],
      encaminhamentos: ["Fisioterapia", "Nutrição"],
    },
    amarelo: {
      agora: ["Manter exercício de levantar da cadeira 2 vezes por semana."],
      encaminhamentos: ["Educador físico"],
    },
  },
  preensao: {
    vermelho: {
      agora: [
        "Iniciar treino de força para membros superiores e inferiores 2 a 3 vezes por semana, com carga progressiva.",
      ],
      medio: [
        "Avaliação nutricional com atenção à ingestão de proteína (alvo habitual de 1,0 a 1,2 g por quilo de peso ao dia, ajustado pelo médico se houver doença renal).",
      ],
      encaminhamentos: ["Fisioterapia", "Nutrição"],
    },
    amarelo: {
      agora: ["Manter atividade física com componente de força."],
      encaminhamentos: ["Educador físico"],
    },
  },
  sppb: {
    vermelho: {
      agora: [
        "Iniciar fisioterapia com treino de equilíbrio, marcha e força, 2 a 3 vezes por semana.",
      ],
      medio: ["Reavaliar o SPPB em 3 meses para medir o ganho de forma objetiva."],
      encaminhamentos: ["Fisioterapia"],
    },
    amarelo: {
      agora: [
        "Incluir exercícios de equilíbrio (apoio em um pé segurando a bancada, 3 séries de 10 segundos por perna, diariamente).",
      ],
      encaminhamentos: ["Educador físico"],
    },
  },
  fast: {
    vermelho: {
      agora: [
        "Adequar o ambiente para reduzir riscos e manter rotina previsível.",
        "Planejar supervisão diária e registrar preferências/diretivas enquanto isso ainda for possível.",
      ],
      medio: [
        "Terapia ocupacional para adaptar tarefas e orientar o cuidador.",
        "Avaliar sobrecarga do cuidador e necessidade de revezamento ou apoio domiciliar.",
        "Antecipar prevenção de lesão por pressão e disfagia conforme a dependência progride.",
      ],
      encaminhamentos: ["Terapia ocupacional", "Fisioterapia", "Fonoaudiologia", "Cuidados paliativos"],
      contato: ["Perda funcional abrupta ou fora da sequência habitual merece investigação de causa aguda."],
    },
    amarelo: {
      agora: ["Supervisionar atividades instrumentais de maior risco, como finanças, medicamentos e direção."],
      medio: ["Investigar causas reversíveis e reavaliar o estágio funcional periodicamente."],
      encaminhamentos: ["Terapia ocupacional", "Neuropsicologia"],
    },
  },
  esas: {
    vermelho: {
      agora: ["Priorizar o controle dos sintomas mais intensos e revisar cada sintoma individualmente."],
      medio: ["Reaplicar a ESAS para acompanhar resposta ao controle sintomático."],
      encaminhamentos: ["Cuidados paliativos"],
      contato: ["Qualquer sintoma que alcance nota 7 ou mais requer revisão clínica sem aguardar a próxima consulta de rotina."],
    },
    amarelo: {
      agora: ["Escolher os sintomas que mais incomodam e tratá-los de forma prioritária."],
      medio: ["Reaplicar a escala nas consultas seguintes."],
      encaminhamentos: ["Cuidados paliativos"],
    },
  },

  lace: {
    vermelho: {
      agora: [
        "Agendar contato telefônico ou visita em até 7 a 14 dias após a alta hospitalar.",
        "Revisar a lista de medicamentos com o médico logo após a alta — é o período de maior risco de erro e interação medicamentosa.",
      ],
      medio: [
        "Manter acompanhamento próximo (presencial ou telefônico) nas primeiras semanas após a internação, atento a sinais precoces de piora.",
      ],
      encaminhamentos: ["Coordenação de cuidado interdisciplinar"],
      contato: [
        "Qualquer sinal de piora, febre, confusão nova ou dificuldade em seguir as orientações da alta.",
      ],
    },
    amarelo: {
      agora: ["Confirmar consulta de retorno em até 2 a 3 semanas após a alta."],
      encaminhamentos: [],
    },
  },
};

export function interventionFor(
  scaleId: string,
  color: ClinicalColor,
): InterventionPlan {
  if (color === "cinza") return emptyInterventionPlan();
  return mergeInterventionPlans(LEGACY_INTERVENTIONS[scaleId]?.[color] ?? {});
}

export function buildCombinedPlan(
  results: readonly { scaleId: string; color: ClinicalColor }[],
): InterventionPlan {
  return mergeInterventionPlans(
    ...results.map(({ scaleId, color }) => interventionFor(scaleId, color)),
  );
}

import type {
  CapacityComparableStatus,
  CapacityDimensionHistory,
  CapacityDimensionRow,
  CapacityDimensionStatus,
} from "@/domain/capacity-dimension-history";
import styles from "./capacity-dimension-history-chart.module.css";

const STATUS_LABEL: Record<CapacityDimensionStatus, string> = {
  "not-assessed": "Não avaliada",
  recorded: "Registrada sem estado de domínio",
  indeterminate: "Indeterminada / discordante",
  preserved: "Sem redução detectada",
  attention: "Sinal de atenção",
  altered: "Redução identificada",
};

const STATUS_Y: Record<CapacityComparableStatus, number> = {
  preserved: 58,
  attention: 132,
  altered: 206,
};

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(value));
}

function isComparable(status: CapacityDimensionStatus): status is CapacityComparableStatus {
  return status === "preserved" || status === "attention" || status === "altered";
}

function assessmentDetail(item: CapacityDimensionRow["cells"][number]["assessments"][number]): string {
  const score = item.scoreText ? `; resultado ${item.scoreText}` : "";
  const classification = item.classification ? `; classificação ${item.classification}` : "";
  const selected = item.selectedForDomainState ? "; usado no estado do domínio" : "; complementar/contextual";
  const proxy = item.basis === "proxy" ? "; indicador proxy" : "";
  return `${item.scaleName} (${item.scaleVersion})${score}${classification}${selected}${proxy}`;
}

function lineSegments(
  dimension: CapacityDimensionRow,
  xByConsultation: ReadonlyMap<string, number>,
): Array<Array<{
  x: number;
  y: number;
  consultationId: string;
  status: CapacityComparableStatus;
  comparabilityKey: string;
  instruments: string[];
  reason: string;
}>> {
  const segments: Array<Array<{
    x: number;
    y: number;
    consultationId: string;
    status: CapacityComparableStatus;
    comparabilityKey: string;
    instruments: string[];
    reason: string;
  }>> = [];
  let current: Array<{
    x: number;
    y: number;
    consultationId: string;
    status: CapacityComparableStatus;
    comparabilityKey: string;
    instruments: string[];
    reason: string;
  }> = [];

  for (const cell of dimension.cells) {
    if (!isComparable(cell.status) || !cell.comparabilityKey) {
      if (current.length > 0) segments.push(current);
      current = [];
      continue;
    }
    const x = xByConsultation.get(cell.consultationId);
    if (x === undefined) continue;

    if (current.length > 0 && current.at(-1)?.comparabilityKey !== cell.comparabilityKey) {
      segments.push(current);
      current = [];
    }

    current.push({
      x,
      y: STATUS_Y[cell.status],
      consultationId: cell.consultationId,
      status: cell.status,
      comparabilityKey: cell.comparabilityKey,
      instruments: cell.assessments.map(assessmentDetail),
      reason: cell.statusReason,
    });
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

export function CapacityDimensionHistoryChart({
  history,
  context,
}: {
  history: CapacityDimensionHistory;
  context: "patient-home" | "final-report";
}) {
  if (!history.hasAssessmentData || history.consultations.length === 0) {
    return (
      <p className={styles.empty}>
        Ainda não há avaliações suficientes de capacidade intrínseca ou funcional para compor o gráfico longitudinal.
      </p>
    );
  }

  const description = context === "final-report"
    ? "Inclui a consulta deste relatório e as consultas anteriores disponíveis no horizonte longitudinal."
    : "Inclui as consultas com avaliações já preenchidas; a consulta mais recente aparece assim que houver dados registrados.";

  const chartWidth = Math.max(760, 180 + Math.max(history.consultations.length - 1, 1) * 145);
  const left = 128;
  const right = 34;
  const usableWidth = chartWidth - left - right;
  const times = history.consultations.map((consultation) => new Date(consultation.occurredAt).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeSpan = maxTime - minTime;
  const xByConsultation = new Map(history.consultations.map((consultation) => {
    const currentTime = new Date(consultation.occurredAt).getTime();
    const x = timeSpan > 0
      ? left + usableWidth * ((currentTime - minTime) / timeSpan)
      : left + usableWidth / 2;
    return [consultation.id, x] as const;
  }));
  const inflectionKeys = new Set(history.inflectionPoints.map((point) => `${point.dimensionCode}:${point.consultationId}`));
  const inflectionConsultations = new Set(history.inflectionPoints.map((point) => point.consultationId));

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>
        <strong>Evolução da capacidade intrínseca e da independência funcional</strong>
        <span>{description}</span>
        <span>Modelo metodológico: {history.methodologyVersion}. O eixo horizontal respeita o intervalo real entre as consultas.</span>
      </figcaption>

      <div className={styles.dimensionLegend} aria-label="Dimensões do gráfico">
        {history.dimensions.map((dimension) => (
          <span key={dimension.code} data-dimension={dimension.code}>
            <i aria-hidden="true" />{dimension.label}
          </span>
        ))}
      </div>

      <div className={styles.scroll} tabIndex={0} aria-label="Gráfico longitudinal em linha, rolável por consulta">
        <svg
          className={styles.chart}
          viewBox={`0 0 ${chartWidth} 284`}
          role="img"
          aria-labelledby="capacity-line-title capacity-line-desc"
        >
          <title id="capacity-line-title">Evolução longitudinal da independência funcional e dos domínios de capacidade intrínseca</title>
          <desc id="capacity-line-desc">
            Linhas categóricas por domínio ao longo do tempo real. Uma linha só conecta avaliações metodologicamente comparáveis do mesmo instrumento e versão. Lacunas, discordâncias e trocas de instrumento não são interpretadas como estabilidade nem como tendência.
          </desc>

          {(["preserved", "attention", "altered"] as const).map((status) => (
            <g key={status}>
              <line className={styles.gridLine} x1={left} x2={chartWidth - right} y1={STATUS_Y[status]} y2={STATUS_Y[status]} />
              <text className={styles.axisLabel} x={left - 12} y={STATUS_Y[status] + 4} textAnchor="end">
                {STATUS_LABEL[status]}
              </text>
            </g>
          ))}

          {history.consultations.map((consultation) => {
            const x = xByConsultation.get(consultation.id) ?? left;
            const isInflectionConsultation = inflectionConsultations.has(consultation.id);
            return (
              <g key={consultation.id}>
                {isInflectionConsultation ? (
                  <line className={styles.inflectionGuide} x1={x} x2={x} y1={34} y2={218} />
                ) : null}
                {consultation.isTarget ? (
                  <line className={styles.targetGuide} x1={x} x2={x} y1={34} y2={218} />
                ) : null}
                <text className={styles.dateLabel} x={x} y={246} textAnchor="middle">
                  {displayDate(consultation.occurredAt)}
                </text>
                {consultation.isTarget ? (
                  <text className={styles.targetLabel} x={x} y={263} textAnchor="middle">
                    {context === "final-report" ? "consulta atual" : "mais recente"}
                  </text>
                ) : null}
              </g>
            );
          })}

          {history.dimensions.map((dimension) => {
            const segments = lineSegments(dimension, xByConsultation);
            return (
              <g key={dimension.code} data-dimension={dimension.code}>
                {segments.map((segment, segmentIndex) => (
                  <polyline
                    key={`${dimension.code}-segment-${segmentIndex}`}
                    className={styles.seriesLine}
                    points={segment.map((point) => `${point.x},${point.y}`).join(" ")}
                  />
                ))}
                {segments.flat().map((point) => {
                  const isInflection = inflectionKeys.has(`${dimension.code}:${point.consultationId}`);
                  return (
                    <circle
                      key={`${dimension.code}-${point.consultationId}`}
                      className={isInflection ? styles.inflectionPoint : styles.seriesPoint}
                      cx={point.x}
                      cy={point.y}
                      r={isInflection ? 6 : 4}
                    >
                      <title>{`${dimension.label}: ${STATUS_LABEL[point.status]}. ${point.reason}${point.instruments.length ? ` Instrumentos: ${point.instruments.join(" | ")}.` : ""}`}</title>
                    </circle>
                  );
                })}
                {dimension.cells.filter((cell) => cell.status === "indeterminate").map((cell) => {
                  const x = xByConsultation.get(cell.consultationId);
                  if (x === undefined) return null;
                  const size = 6;
                  return (
                    <polygon
                      key={`${dimension.code}-${cell.consultationId}-indeterminate`}
                      className={styles.indeterminatePoint}
                      points={`${x},${STATUS_Y.attention - size} ${x + size},${STATUS_Y.attention} ${x},${STATUS_Y.attention + size} ${x - size},${STATUS_Y.attention}`}
                    >
                      <title>{`${dimension.label}: ${STATUS_LABEL.indeterminate}. ${cell.statusReason} Instrumentos: ${cell.assessments.map(assessmentDetail).join(" | ")}.`}</title>
                    </polygon>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.statusLegend} aria-label="Leitura do eixo clínico">
        <span><i data-status="preserved" aria-hidden="true" />Sem redução detectada</span>
        <span><i data-status="attention" aria-hidden="true" />Sinal de atenção</span>
        <span><i data-status="altered" aria-hidden="true" />Redução identificada</span>
        <span><i data-status="indeterminate" aria-hidden="true" />Losango = resultados discordantes</span>
        <span><i data-status="missing" aria-hidden="true" />Sem ponto = não avaliada, sem regra ou sem comparabilidade</span>
      </div>

      {history.inflectionPoints.length > 0 ? (
        <section className={styles.inflectionSection} aria-labelledby="capacity-inflection-title">
          <h3 id="capacity-inflection-title">Pontos de inflexão observados</h3>
          <ul>
            {history.inflectionPoints.map((point) => (
              <li key={`${point.dimensionCode}-${point.consultationId}-${point.previousConsultationId}`}>
                <strong>{displayDate(point.occurredAt)} · {point.dimensionLabel}</strong>
                <span>
                  {point.direction === "worsened" ? "Piora observada" : "Melhora observada"}: {STATUS_LABEL[point.fromStatus]} → {STATUS_LABEL[point.toStatus]}.
                </span>
                <span>Comparabilidade: mesmo instrumento e versão ({point.comparabilityKey}).</span>
                {point.milestones.length > 0 ? (
                  <span>
                    Registro clínico na mesma consulta: {point.milestones.map((milestone) => (
                      milestone.note ? `${milestone.title} — ${milestone.note}` : milestone.title
                    )).join("; ")}.
                  </span>
                ) : (
                  <span>Sem evento clínico relacionado explicitamente registrado nesta consulta; o gráfico não atribui causa.</span>
                )}
              </li>
            ))}
          </ul>
          <p className={styles.causalityNote}>
            Os marcos indicam apenas coincidência temporal com registros clínicos existentes. Causalidade não é inferida pelo software.
          </p>
        </section>
      ) : null}

      <p className={styles.frameworkNote}>
        {history.methodologyNote} Resultados originais, versões, classificação e fonte permanecem vinculados aos pontos. Quando instrumentos de mesma prioridade discordam, o domínio fica indeterminado; quando o instrumento muda, a linha é interrompida em vez de fabricar uma tendência.
      </p>
    </figure>
  );
}

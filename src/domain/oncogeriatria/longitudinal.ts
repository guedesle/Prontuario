import { SCALE_DIRECTIONS, type ScaleDirection, type ScaleTrend } from "../longitudinal-scales.ts";

export interface OncogeriatricNumericObservation {
  id?: string;
  consultationId?: string;
  code: string;
  version: string;
  occurredAt: Date;
  value: number;
}

export interface OncogeriatricDelta {
  code: string;
  version: string;
  baseline: number;
  current: number;
  delta: number;
  baselineAt: Date;
  currentAt: Date;
  direction?: ScaleDirection;
  trend: ScaleTrend;
}

export interface OncogeriatricRecoveryObservation {
  id: string;
  domain: string;
  assessedAt: Date;
}

export function buildOncogeriatricDelta(observations: OncogeriatricNumericObservation[]): OncogeriatricDelta | null {
  if (observations.length < 2) return null;
  const ordered = [...observations].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const baseline = ordered[0];
  const current = ordered[ordered.length - 1];
  if (!baseline || !current) return null;
  if (baseline.code !== current.code || baseline.version !== current.version) return null;
  if (ordered.some((item) => item.code !== baseline.code || item.version !== baseline.version)) return null;
  const delta = current.value - baseline.value;
  const direction = SCALE_DIRECTIONS[baseline.code.toLocaleLowerCase("pt-BR")];
  const trend: ScaleTrend = delta === 0
    ? "stable"
    : !direction
      ? "not-comparable"
      : direction === "higher-better"
        ? (delta > 0 ? "favorable" : "unfavorable")
        : (delta < 0 ? "favorable" : "unfavorable");
  return {
    code: baseline.code,
    version: baseline.version,
    baseline: baseline.value,
    current: current.value,
    delta,
    baselineAt: baseline.occurredAt,
    currentAt: current.occurredAt,
    direction,
    trend,
  };
}

export function groupComparableObservations(observations: OncogeriatricNumericObservation[]) {
  const groups = new Map<string, OncogeriatricNumericObservation[]>();
  for (const observation of observations) {
    const key = `${observation.code}::${observation.version}`;
    const current = groups.get(key) ?? [];
    current.push(observation);
    groups.set(key, current);
  }
  return [...groups.values()].map((group) => {
    const effective = new Map<string, OncogeriatricNumericObservation>();
    for (const observation of group) {
      const key = observation.consultationId ?? observation.id ?? observation.occurredAt.toISOString();
      const previous = effective.get(key);
      if (!previous || observation.occurredAt.getTime() >= previous.occurredAt.getTime()) effective.set(key, observation);
    }
    const ordered = [...effective.values()].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime() || (a.id ?? "").localeCompare(b.id ?? ""));
    return {
      code: ordered[0]?.code ?? "",
      version: ordered[0]?.version ?? "",
      observations: ordered,
    };
  });
}

export function latestRecoveryAssessmentsByDomain<T extends OncogeriatricRecoveryObservation>(observations: T[]): T[] {
  const ordered = [...observations].sort((a, b) => {
    const dateDelta = b.assessedAt.getTime() - a.assessedAt.getTime();
    return dateDelta !== 0 ? dateDelta : b.id.localeCompare(a.id);
  });
  const latest = new Map<string, T>();
  for (const observation of ordered) {
    if (!latest.has(observation.domain)) latest.set(observation.domain, observation);
  }
  return [...latest.values()];
}

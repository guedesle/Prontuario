export interface OncogeriatricNumericObservation {
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
}

export function buildOncogeriatricDelta(observations: OncogeriatricNumericObservation[]): OncogeriatricDelta | null {
  if (observations.length < 2) return null;
  const ordered = [...observations].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const baseline = ordered[0];
  const current = ordered[ordered.length - 1];
  if (!baseline || !current) return null;
  if (baseline.code !== current.code || baseline.version !== current.version) return null;
  if (ordered.some((item) => item.code !== baseline.code || item.version !== baseline.version)) return null;
  return {
    code: baseline.code,
    version: baseline.version,
    baseline: baseline.value,
    current: current.value,
    delta: current.value - baseline.value,
    baselineAt: baseline.occurredAt,
    currentAt: current.occurredAt,
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
  return [...groups.values()].map((group) => ({
    code: group[0]?.code ?? "",
    version: group[0]?.version ?? "",
    observations: group.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()),
  }));
}

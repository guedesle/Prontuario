import { notFound } from "next/navigation";
import { Program55Nav } from "@/components/program55/program55-nav";
import { CapacityDimensionHistoryChart } from "@/components/reports/capacity-dimension-history-chart";
import { ClinicalMetricTrendChart } from "@/components/reports/clinical-metric-trend-chart";
import { buildProblemCapacityMilestones } from "@/domain/capacity-timeline-milestones";
import { SCALE_DIRECTIONS } from "@/domain/longitudinal-scales";
import { buildProgram55CapacityHistory, program55LinkedConsultationIds } from "@/domain/program55/capacity-history";
import { program55CheckpointLabel } from "@/domain/program55/checkpoints";
import { isProgram55Eligible } from "@/domain/program55/eligibility";
import { isProgram55Enabled } from "@/domain/program55/feature";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { prisma } from "@/server/db";

function fmt(value: { toString(): string } | null | undefined, unit = ""): string { return value === null || value === undefined ? "—" : `${value.toString()}${unit}`; }
function date(value: Date): string { return value.toISOString().slice(0, 10).split("-").reverse().join("/"); }
function directionLabel(code: string): string {
  const direction = SCALE_DIRECTIONS[code];
  if (direction === "higher-better") return "Nesta escala, valores maiores representam melhor resultado.";
  if (direction === "higher-worse") return "Nesta escala, valores maiores representam pior resultado.";
  return "Valores brutos registrados; direção clínica não configurada.";
}

export default async function Program55LongitudinalPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuthenticatedUser("patient.read");
  if (!isProgram55Enabled(process.env.PROGRAM55_EMERGENCY_DISABLED)) notFound();
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: {
      id: true, fullName: true, birthDate: true,
      program55Enrollment: {
        select: {
          checkpoints: {
            orderBy: { referenceDate: "asc" },
            select: {
              id: true, checkpointType: true, referenceDate: true, status: true, coordinatingConsultationId: true,
              bodyComposition: { orderBy: { measuredAt: "desc" }, take: 1, select: { measuredAt: true, weightKg: true, bmi: true, waistCm: true, bodyFatPercent: true, fatMassKg: true, fatFreeMassKg: true, muscleMassKg: true } },
              professionalAssessments: { select: { discipline: true, status: true, sharedSummary: true, assessedAt: true } },
            },
          },
        },
      },
      scaleAssessments: {
        orderBy: { appliedAt: "asc" },
        select: { id: true, patientId: true, consultationId: true, scaleCode: true, scaleVersion: true, scoreNumeric: true, scoreText: true, classification: true, interpretation: true, clinicalColor: true, appliedAt: true, scaleDefinition: { select: { name: true, dimension: true, sourceCitation: true, definitionHash: true } } },
      },
      consultations: { select: { id: true, patientId: true, occurredAt: true, createdAt: true } },
      problems: {
        select: {
          patientId: true, originConsultationId: true, title: true, description: true, createdAt: true,
          events: { orderBy: { createdAt: "asc" }, select: { patientId: true, consultationId: true, note: true, createdAt: true } },
        },
      },
    },
  });
  if (!patient || !isProgram55Eligible(patient.birthDate) || !patient.program55Enrollment) notFound();
  const checkpoints = patient.program55Enrollment.checkpoints;
  const linkedConsultationIds = program55LinkedConsultationIds(checkpoints);
  const linkedConsultationSet = new Set(linkedConsultationIds);
  const linkedAssessments = patient.scaleAssessments.filter((assessment) => linkedConsultationSet.has(assessment.consultationId));
  const milestones = buildProblemCapacityMilestones({ patientId: patient.id, problems: patient.problems, consultationIds: linkedConsultationIds });
  const capacityHistory = buildProgram55CapacityHistory({
    patientId: patient.id,
    checkpoints,
    consultations: patient.consultations,
    assessments: linkedAssessments.map((assessment) => ({
      id: assessment.id,
      patientId: assessment.patientId,
      consultationId: assessment.consultationId,
      scaleCode: assessment.scaleCode,
      scaleVersion: assessment.scaleVersion,
      scoreNumeric: assessment.scoreNumeric === null ? null : Number(assessment.scoreNumeric),
      scoreText: assessment.scoreText,
      classification: assessment.classification,
      interpretation: assessment.interpretation,
      clinicalColor: assessment.clinicalColor as "verde" | "amarelo" | "vermelho" | null,
      appliedAt: assessment.appliedAt,
      sourceCitation: assessment.scaleDefinition?.sourceCitation,
      definitionHash: assessment.scaleDefinition?.definitionHash,
    })),
    milestones,
  });
  const metrics = [
    ["Peso", "weightKg", " kg"], ["IMC", "bmi", ""], ["Circunferência abdominal", "waistCm", " cm"],
    ["Gordura corporal", "bodyFatPercent", "%"], ["Massa de gordura", "fatMassKg", " kg"],
    ["Massa livre de gordura", "fatFreeMassKg", " kg"], ["Massa muscular", "muscleMassKg", " kg"],
  ] as const;
  const scaleGroups = new Map<string, typeof linkedAssessments>();
  for (const assessment of linkedAssessments) {
    const key = `${assessment.scaleCode}@@${assessment.scaleVersion}`;
    const group = scaleGroups.get(key) ?? [];
    group.push(assessment);
    scaleGroups.set(key, group);
  }

  return (
    <main className="shell">
      <header className="hero compact-hero"><p className="eyebrow">Programa 55+ · Evolução longitudinal</p><h1>{patient.fullName}</h1><p>Comparação por datas reais, unidades explícitas e versões de escala preservadas.</p></header>
      <Program55Nav patientId={patient.id} />

      <section className="panel" aria-labelledby="long-body-title">
        <div className="section-heading"><div><p className="eyebrow">Composição corporal</p><h2 id="long-body-title">Baseline · 90 dias · 180 dias · 12 meses</h2></div><span className="muted">Sem classificação cromática para valores contínuos</span></div>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}><thead><tr><th>Indicador</th>{checkpoints.map((checkpoint) => <th key={checkpoint.id}>{program55CheckpointLabel(checkpoint.checkpointType)}<div className="muted">{date(checkpoint.referenceDate)}</div></th>)}</tr></thead><tbody>{metrics.map(([label, field, unit]) => <tr key={field} style={{ borderTop: "1px solid var(--line)" }}><th scope="row" style={{ textAlign: "left", padding: 10 }}>{label}</th>{checkpoints.map((checkpoint) => { const value = checkpoint.bodyComposition[0]?.[field]; return <td key={checkpoint.id} style={{ padding: 10, textAlign: "center" }}>{fmt(value, unit)}</td>; })}</tr>)}</tbody></table></div>
      </section>

      <section className="panel" style={{ marginTop: 24 }} aria-labelledby="long-team-title">
        <div className="section-heading"><div><p className="eyebrow">Equipe</p><h2 id="long-team-title">Status por checkpoint</h2></div><span className="muted">Status operacional</span></div>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}><thead><tr><th>Domínio</th>{checkpoints.map((checkpoint) => <th key={checkpoint.id}>{program55CheckpointLabel(checkpoint.checkpointType)}</th>)}</tr></thead><tbody>{["PHYSICIAN", "NUTRITION", "PHYSIOTHERAPY", "PSYCHOLOGY"].map((discipline) => <tr key={discipline} style={{ borderTop: "1px solid var(--line)" }}><th scope="row" style={{ textAlign: "left", padding: 10 }}>{discipline}</th>{checkpoints.map((checkpoint) => <td key={checkpoint.id} style={{ padding: 10, textAlign: "center" }}>{checkpoint.professionalAssessments.find((item) => item.discipline === discipline)?.status ?? "PENDENTE"}</td>)}</tr>)}</tbody></table></div>
      </section>

      <section className="panel" style={{ marginTop: 24 }} aria-labelledby="long-scales-title">
        <div className="section-heading"><div><p className="eyebrow">Escalas clínicas existentes</p><h2 id="long-scales-title">Séries por instrumento e versão</h2></div><span className="muted">Versões diferentes nunca são mescladas</span></div>
        <p className="muted">Somente avaliações de consultas explicitamente vinculadas aos checkpoints deste ciclo 55+ são exibidas.</p>
        {scaleGroups.size ? <div className="grid">{Array.from(scaleGroups.entries()).map(([key, assessments]) => {
          const effective = new Map<string, (typeof assessments)[number]>();
          for (const assessment of assessments) {
            const previous = effective.get(assessment.consultationId);
            if (!previous || assessment.appliedAt.getTime() >= previous.appliedAt.getTime()) effective.set(assessment.consultationId, assessment);
          }
          const first = assessments[0]!;
          const numericPoints = [...effective.values()].filter((assessment) => assessment.scoreNumeric !== null).map((assessment) => ({ id: assessment.id, at: assessment.appliedAt, value: Number(assessment.scoreNumeric), context: assessment.classification }));
          return numericPoints.length ? <ClinicalMetricTrendChart key={key} title={`${first.scaleDefinition?.name ?? first.scaleCode} · versão ${first.scaleVersion}`} directionLabel={directionLabel(first.scaleCode)} points={numericPoints} /> : <article className="card" key={key}><h3>{first.scaleDefinition?.name ?? first.scaleCode}</h3><p className="muted">versão {first.scaleVersion} · sem escore numérico para traçar</p><ul className="clean-list">{[...effective.values()].map((assessment) => <li key={assessment.id}><span>{date(assessment.appliedAt)}</span><strong>{assessment.scoreText ?? assessment.classification ?? "Resultado registrado"}</strong></li>)}</ul></article>;
        })}</div> : <p className="muted">Sem escalas vinculadas aos checkpoints do ciclo.</p>}
      </section>

      <section className="panel" style={{ marginTop: 24 }} aria-label="Trajetória dos domínios no Programa 55+">
        <div className="section-heading"><div><p className="eyebrow">Domínios</p><h2>Capacidade e independência no ciclo 55+</h2></div><span className="muted">Contexto temporal documentado, sem atribuição automática de causa</span></div>
        <CapacityDimensionHistoryChart history={capacityHistory} context="patient-home" />
      </section>
    </main>
  );
}

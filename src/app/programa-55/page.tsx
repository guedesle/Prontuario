import { notFound } from "next/navigation";
import {
  ageOnDate,
  isProgram55Eligible,
  PROGRAM55_MAX_AGE,
  PROGRAM55_MIN_AGE,
} from "@/domain/program55/eligibility";
import { isProgram55Enabled } from "@/domain/program55/feature";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { prisma } from "@/server/db";

function formatDate(value: Date | null | undefined): string {
  return value ? value.toISOString().slice(0, 10).split("-").reverse().join("/") : "não registrada";
}

export default async function Program55HomePage() {
  await requireAuthenticatedUser("patient.read");
  if (!isProgram55Enabled(process.env.PROGRAM55_EMERGENCY_DISABLED)) notFound();

  const referenceDate = new Date();
  const patients = await prisma.patient.findMany({
    where: { birthDate: { not: null } },
    orderBy: [{ fullName: "asc" }, { id: "asc" }],
    select: {
      id: true,
      fullName: true,
      birthDate: true,
      consultations: {
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: { occurredAt: true },
      },
    },
  });

  const eligiblePatients = patients.filter((patient) => isProgram55Eligible(patient.birthDate, referenceDate));

  return (
    <main className="shell home-shell">
      <header className="hero compact-hero">
        <p className="eyebrow">Programa 55+ · {PROGRAM55_MIN_AGE} a {PROGRAM55_MAX_AGE} anos</p>
        <h1>Saúde, Longevidade e Autonomia</h1>
        <p>
          Área longitudinal dedicada aos pacientes entre {PROGRAM55_MIN_AGE} e {PROGRAM55_MAX_AGE} anos,
          vinculada ao mesmo cadastro e ao mesmo prontuário clínico.
        </p>
      </header>

      <section className="notice" aria-label="Escopo do Programa 55+">
        <strong>Um paciente, um prontuário, uma linha longitudinal</strong>
        <span>
          Esta área reutiliza os dados clínicos já persistidos e não cria cadastro paralelo, não duplica paciente
          e não modifica escalas ou regras clínicas consolidadas.
        </span>
      </section>

      <section className="panel" aria-labelledby="program55-patients-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Pacientes elegíveis</p>
            <h2 id="program55-patients-title">{eligiblePatients.length} paciente(s) entre {PROGRAM55_MIN_AGE} e {PROGRAM55_MAX_AGE} anos</h2>
          </div>
          <a href="/">Voltar à página inicial</a>
        </div>

        {eligiblePatients.length ? (
          <ul className="clean-list">
            {eligiblePatients.map((patient) => (
              <li key={patient.id}>
                <a href={`/patients/${patient.id}/programa-55`}>
                  <strong>{patient.fullName}</strong> · {ageOnDate(patient.birthDate as Date, referenceDate)} anos
                </a>
                <span>
                  nascimento {formatDate(patient.birthDate)} · última consulta {formatDate(patient.consultations[0]?.occurredAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Nenhum paciente com data de nascimento registrada está atualmente na faixa de 55 a 70 anos.</p>
        )}
      </section>
    </main>
  );
}

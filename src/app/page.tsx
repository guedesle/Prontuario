import { PatientFinder } from "@/components/patients/patient-finder";
import { requireAuthenticatedUser } from "@/server/auth/require-user";

const modules = [
  ["Paciente", "Identidade segura, homônimos e continuidade longitudinal"],
  ["AGA inicial", "Linha de base clínica, funcional e geriátrica"],
  ["Escalas", "Avaliações aplicadas na própria consulta, com interpretação"],
  ["Problemas", "Problemas clínicos e geriátricos acompanhados ao longo do tempo"],
  ["Medicações", "Reconciliação por consulta e organização estruturada dos horários"],
  ["SOAP", "Registro técnico para revisão e cópia ao prontuário"],
  ["Revisão clínica", "Confirmação médica antes das saídas compartilháveis"],
  ["Relatório final", "Orientações acessíveis e tabela final de medicamentos"],
];

export default async function Home() {
  await requireAuthenticatedUser("patient.read");

  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">Prática clínica · continuidade do cuidado</p>
        <h1>Prontuário Aprimorado</h1>
        <p>
          Paciente → AGA inicial → Escalas → Problemas clínicos e geriátricos →
          Medicações → SOAP → Revisão clínica → Relatório final.
        </p>
      </header>

      <PatientFinder />

      <section className="notice">
        <strong>Segurança por padrão</strong>
        <span>
          A seleção do paciente precede o fluxo clínico. Documentos permanecem vinculados
          à consulta correspondente, e sugestões automáticas dependem de revisão médica
          antes de impressão ou exportação.
        </span>
      </section>

      <section className="grid" aria-label="Etapas do fluxo clínico">
        {modules.map(([title, description]) => (
          <article className="card" key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <p className="demo-link"><a href="/demo">Abrir demonstração longitudinal sintética →</a></p>
    </main>
  );
}

import type { ClinicalProblem } from "@/domain/problems";
import { splitProblems } from "@/domain/problems";

function ProblemList({ problems }: { problems: readonly ClinicalProblem[] }) {
  if (problems.length === 0) return <p className="muted">Sem problemas registrados.</p>;
  return (
    <ul className="problem-list">
      {problems.map((problem) => (
        <li key={problem.id}>
          <strong>{problem.title}</strong>
          <span>{problem.status}</span>
          {problem.description ? <p>{problem.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function ProblemColumns({ problems }: { problems: readonly ClinicalProblem[] }) {
  const grouped = splitProblems([...problems]);
  return (
    <section className="problem-columns" aria-label="Lista de problemas por domínio">
      <article className="panel">
        <h2>Problemas clínicos</h2>
        <ProblemList problems={grouped.clinical} />
      </article>
      <article className="panel">
        <h2>Problemas geriátricos</h2>
        <ProblemList problems={grouped.geriatric} />
      </article>
    </section>
  );
}

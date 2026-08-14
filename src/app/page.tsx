const modules = [
  ["Paciente", "Identidade, contatos, cuidador e linha de base"],
  ["Consulta", "AGA inicial e consultas subsequentes"],
  ["Problemas", "Clínicos e geriátricos, com histórico de status"],
  ["Evolução", "Escalas, tendências e comparação com baseline"],
  ["Plano", "Intervenções sugeridas sujeitas à revisão médica"],
  ["Saídas", "SOAP, relatório da família e medicamentos"],
];

export default function Home() {
  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">Base técnica · migração em andamento</p>
        <h1>Prontuário Aprimorado</h1>
        <p>
          Arquitetura longitudinal: Paciente → AGA inicial → Problemas →
          Consultas subsequentes → Evolução → Plano → Documentos.
        </p>
      </header>

      <p className="demo-link"><a href="/patients/new">Cadastrar paciente com verificação de duplicidade →</a></p>
      <p className="demo-link"><a href="/demo">Abrir demonstração longitudinal sintética →</a></p>

      <section className="notice">
        <strong>Segurança por padrão</strong>
        <span>
          Autenticação, autorização e auditoria estão implementadas no scaffold,
          mas dados reais só podem ser usados após migration, testes MySQL,
          backup/restore e checklist de go-live concluídos.
        </span>
      </section>

      <section className="grid">
        {modules.map(([title, description]) => (
          <article className="card" key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

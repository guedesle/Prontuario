"use client";

import { useState, type FormEvent } from "react";

interface PatientSearchResult {
  id: string;
  fullName: string;
  birthDate: string | null;
  needsIdentityReview: boolean;
}

interface PatientSearchResponse {
  results?: PatientSearchResult[];
  message?: string;
}

export function PatientFinder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const compactQuery = query.trim().replace(/\s+/g, " ");
    if (compactQuery.length < 2) {
      setResults([]);
      setMessage("Digite pelo menos 2 caracteres para localizar um paciente.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/patients/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: compactQuery }),
      });
      const payload = await response.json() as PatientSearchResponse;
      if (!response.ok) {
        setResults([]);
        setMessage(payload.message ?? "Não foi possível localizar pacientes.");
        return;
      }

      const nextResults = payload.results ?? [];
      setResults(nextResults);
      setMessage(nextResults.length === 0 ? "Nenhum paciente encontrado." : null);
    } catch {
      setResults([]);
      setMessage("Não foi possível localizar pacientes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="patient-finder-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Acesso rápido</p>
          <h2 id="patient-finder-title">Localizar paciente</h2>
        </div>
        <a href="/patients/new">Cadastrar novo paciente</a>
      </div>

      <form className="patient-form" onSubmit={handleSubmit}>
        <label htmlFor="patient-search-query">
          Nome ou parte do nome
          <input
            id="patient-search-query"
            name="query"
            type="search"
            minLength={2}
            maxLength={120}
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: Maria ou Maria Silva"
          />
        </label>
        <span className="muted">Digite pelo menos 2 caracteres. A busca ignora acentos, diferença entre maiúsculas/minúsculas e espaços repetidos.</span>
        <button type="submit" disabled={loading}>
          {loading ? "Localizando..." : "Localizar paciente"}
        </button>
      </form>

      <div aria-live="polite" aria-busy={loading}>
        {message ? <p className={message.startsWith("Digite") ? "field-error" : "muted"}>{message}</p> : null}
        {results.length ? (
          <ul className="clean-list" aria-label="Pacientes encontrados">
            {results.map((patient) => (
              <li key={patient.id}>
                <a href={`/patients/${patient.id}`}>{patient.fullName}</a>
                <span>
                  Nascimento: {patient.birthDate ?? "não registrado"}
                  {patient.needsIdentityReview ? " · homônimo/identidade pendente de revisão" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

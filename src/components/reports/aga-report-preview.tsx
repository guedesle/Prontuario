"use client";

import { useState } from "react";
import type { AgaReportModel } from "@/domain/aga-report";
import { ProblemColumns } from "@/components/problems/problem-columns";

interface GeneratedReportResponse {
  report: AgaReportModel;
  text: string;
  snapshot: { id: string; version: number };
}

export function AgaReportPreview({ consultationId }: { consultationId: string }) {
  const [generated, setGenerated] = useState<GeneratedReportResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/consultations/${consultationId}/reports/aga`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Não foi possível gerar o relatório.");
      setGenerated(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível gerar o relatório.");
    } finally {
      setLoading(false);
    }
  }

  function exportText() {
    if (!generated) return;
    const url = URL.createObjectURL(new Blob([generated.text], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `relatorio-aga-${consultationId}-v${generated.snapshot.version}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="report-workspace">
      <div className="report-actions no-print">
        <button type="button" onClick={() => void generate()} disabled={loading}>
          {loading ? "Gerando snapshot…" : generated ? "Atualizar prévia" : "Gerar prévia"}
        </button>
        <button type="button" onClick={() => window.print()} disabled={!generated}>Imprimir</button>
        <button type="button" onClick={exportText} disabled={!generated}>Exportar</button>
      </div>
      <p className="muted no-print">Gerar, visualizar, imprimir e exportar não finalizam a consulta.</p>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      {generated ? (
        <article className="aga-report">
          <header>
            <p className="eyebrow">Snapshot v{generated.snapshot.version}</p>
            <h1>Relatório da Avaliação Geriátrica Ampla</h1>
            <p>{generated.report.patientName}</p>
            {generated.report.draftContext ? <strong className="draft-watermark">Consulta ainda não finalizada</strong> : null}
          </header>
          <ProblemColumns problems={[...generated.report.clinicalProblems, ...generated.report.geriatricProblems]} />
          {generated.report.alerts.length > 0 ? (
            <section className="visible-alerts">
              <h2>Alertas para revisão médica</h2>
              <ul>{generated.report.alerts.map((alert, index) => <li key={`${alert.severity}-${index}`}>{alert.message}</li>)}</ul>
            </section>
          ) : null}
          <section className="scale-report-list">
            {generated.report.assessedScales.map((scale) => (
              <article className="scale-report-card" key={`${scale.code}-${scale.version}`}>
                <p className="dimension">{scale.dimension}</p>
                <h2>{scale.name}</h2>
                <dl>
                  <dt>Dado coletado</dt><dd>{scale.collectedData.length ? scale.collectedData.map((item) => `${item.field}: ${item.value}`).join("; ") : "Sem respostas detalhadas registradas"}</dd>
                  <dt>Resultado/pontuação</dt><dd>{scale.result.scoreText ?? scale.result.score ?? "Sem pontuação registrada"}</dd>
                  <dt>Interpretação</dt><dd>{scale.interpretation ?? "Sem interpretação registrada"}</dd>
                  <dt>Problema relacionado</dt><dd>{scale.relatedProblemProposals.map((problem) => `[${problem.type}] ${problem.title}`).join("; ") || "Nenhum problema proposto"}</dd>
                  <dt>Evolução</dt><dd>{scale.evolution.vsPrevious}; atual {scale.evolution.current ?? "—"}, anterior {scale.evolution.previous ?? "—"}, baseline {scale.evolution.baseline ?? "—"}</dd>
                  <dt>Fonte</dt><dd>{scale.source.status}{scale.source.citation ? ` · ${scale.source.citation}` : ""}</dd>
                </dl>
                <h3>Sugestões pendentes de revisão médica</h3>
                <ul>{scale.interventionSuggestions.length ? scale.interventionSuggestions.map((suggestion) => <li key={suggestion.text}>{suggestion.text}</li>) : <li>Sem sugestão automática registrada.</li>}</ul>
              </article>
            ))}
          </section>
        </article>
      ) : null}
    </section>
  );
}

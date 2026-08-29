"use client";

import { useEffect, useMemo, useState } from "react";
import type { VaccinationReview } from "@/domain/vaccination-prevention";
import suggestionStyles from "../consultations/professional-plan-suggestion.module.css";
import styles from "./geriatric-conduct-workspace.module.css";

type Problem = {
  id: string;
  type: "CLINICAL" | "GERIATRIC";
  status: "ACTIVE" | "STABLE" | "MONITORING" | "RESOLVED";
  title: string;
};

type PlanSuggestion = {
  problemId: string;
  problemTitle: string;
  proposalKey: string;
  actions: string[];
  evidence: Array<{ scaleCode: string; scaleVersion: string; scoreText: string; classification?: string }>;
  sources: Array<{ pmid: string; label: string }>;
  requiresPhysicianReview: true;
};

type NoteView = {
  consultationId: string;
  consultationStatus: "DRAFT" | "IN_REVIEW" | "FINALIZED";
  updatedAt: string;
  noteVersion: string;
  fields: {
    subjective?: string;
    physicalExam?: string;
    vitalSigns?: string;
    anthropometry?: string;
    vaccinationReview?: VaccinationReview;
    planByProblem?: Record<string, readonly string[]>;
  };
  exams: { current: string };
  problems: Problem[];
  planSuggestions: PlanSuggestion[];
};

function lines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function GeriatricConductWorkspace({ consultationId }: { consultationId: string }) {
  const [view, setView] = useState<NoteView | null>(null);
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/consultations/${consultationId}/note`, { cache: "no-store" });
      const body = await response.json().catch(() => null) as (NoteView & { message?: string }) | null;
      if (!response.ok || !body) throw new Error(body?.message ?? "Não foi possível carregar as condutas.");
      setView(body);
      setPlans(Object.fromEntries(Object.entries(body.fields.planByProblem ?? {}).map(([id, actions]) => [id, actions.join("\n")])));
      setDirty(false);
      setFeedback(null);
    } catch (error) {
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível carregar as condutas." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [consultationId]);
  useEffect(() => {
    function onNoteChanged(event: Event) {
      const detail = (event as CustomEvent<{ consultationId?: string }>).detail;
      if (detail?.consultationId !== consultationId || dirty) return;
      void load();
    }
    window.addEventListener("clinical-note-changed", onNoteChanged);
    return () => window.removeEventListener("clinical-note-changed", onNoteChanged);
  }, [consultationId, dirty]);

  const activeProblems = useMemo(() => (view?.problems ?? []).filter((problem) => problem.status !== "RESOLVED"), [view]);
  const finalized = view?.consultationStatus === "FINALIZED";

  function updatePlan(problemId: string, value: string) {
    setPlans((current) => ({ ...current, [problemId]: value }));
    setDirty(true);
    setFeedback(null);
  }

  function applySuggestion(suggestion: PlanSuggestion) {
    const existing = lines(plans[suggestion.problemId] ?? "");
    const merged = [...existing];
    for (const action of suggestion.actions) if (!merged.includes(action)) merged.push(action);
    updatePlan(suggestion.problemId, merged.join("\n"));
    setDismissedSuggestions((current) => new Set([...current, suggestion.problemId]));
    setFeedback({ kind: "success", text: "Sugestão adicionada ao rascunho das condutas. Revise e edite antes de salvar." });
  }

  async function save() {
    if (!view || saving || finalized) return;
    setSaving(true);
    setFeedback(null);
    try {
      const planByProblem = Object.fromEntries(activeProblems.map((problem) => [problem.id, lines(plans[problem.id] ?? "")]));
      const response = await fetch(`/api/consultations/${consultationId}/note`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedUpdatedAt: view.updatedAt,
          expectedNoteVersion: view.noteVersion,
          subjective: view.fields.subjective,
          physicalExam: view.fields.physicalExam,
          vitalSigns: view.fields.vitalSigns,
          anthropometry: view.fields.anthropometry,
          examsText: view.exams.current,
          vaccinationReview: view.fields.vaccinationReview,
          planByProblem,
        }),
      });
      const body = await response.json().catch(() => null) as (NoteView & { message?: string }) | null;
      if (!response.ok || !body) throw new Error(body?.message ?? "Não foi possível salvar as condutas.");
      setView(body);
      setPlans(Object.fromEntries(Object.entries(body.fields.planByProblem ?? {}).map(([id, actions]) => [id, actions.join("\n")])));
      setDirty(false);
      setFeedback({ kind: "success", text: "Condutas salvas. O P — Plano do SOAP foi sincronizado automaticamente." });
      window.dispatchEvent(new CustomEvent("clinical-note-changed", { detail: { consultationId } }));
    } catch (error) {
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível salvar as condutas." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className={styles.card}><p>Carregando condutas…</p></section>;
  if (!view) return <section className={styles.card}><p role="alert">{feedback?.text ?? "Condutas indisponíveis."}</p></section>;

  return <section id="condutas-profissionais" className={styles.card} aria-labelledby="geriatric-conduct-title">
    <header className={styles.heading}>
      <div>
        <p className={styles.eyebrow}>Área médica · fonte única do plano</p>
        <h3 id="geriatric-conduct-title">Condutas da consulta geriátrica</h3>
        <p>Registre aqui as condutas por problema. O <strong>P — Plano</strong> da evolução SOAP é preenchido a partir desta mesma fonte, evitando dois editores concorrentes e registros divergentes.</p>
      </div>
      <button type="button" onClick={() => void save()} disabled={!dirty || saving || finalized}>{saving ? "Salvando…" : "Salvar condutas"}</button>
    </header>

    {finalized ? <p className={styles.notice}>Consulta finalizada: condutas em modo somente leitura.</p> : null}
    {dirty ? <p className={styles.notice}>Há condutas ainda não salvas.</p> : null}
    {feedback ? <p className={feedback.kind === "error" ? styles.error : styles.success} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p> : null}

    {activeProblems.length === 0 ? <p className={styles.empty}>Não há problemas ativos confirmados para vincular condutas.</p> : <div className={styles.grid}>
      {activeProblems.map((problem, index) => {
        const suggestion = view.planSuggestions.find((item) => item.problemId === problem.id);
        const visibleSuggestion = suggestion && !dismissedSuggestions.has(problem.id) ? suggestion : null;
        const textareaId = `conduct-plan-${problem.id}`;
        return <article className={styles.problem} key={problem.id}>
          <div className={styles.problemHeading}><b>{index + 1}. {problem.title}</b><small>{problem.type === "GERIATRIC" ? "Problema geriátrico" : "Problema clínico"} · {problem.status}</small></div>
          {visibleSuggestion ? <aside className={suggestionStyles.card} aria-label={`Sugestão de plano para ${problem.title}`}>
            <div className={suggestionStyles.header}><strong>Sugestão baseada na avaliação desta consulta</strong><span className={suggestionStyles.badge}>Rascunho · revisão médica</span></div>
            <p className={suggestionStyles.evidence}>Origem: {visibleSuggestion.evidence.map((item) => `${item.scaleCode} ${item.scoreText}${item.classification ? ` — ${item.classification}` : ""}`).join("; ")}.</p>
            <ul className={suggestionStyles.actionsList}>{visibleSuggestion.actions.map((action) => <li key={action}>{action}</li>)}</ul>
            <p className={suggestionStyles.sources}>Fontes: {visibleSuggestion.sources.map((source) => `${source.label} (PMID ${source.pmid})`).join("; ")}.</p>
            <div className={suggestionStyles.controls}><button type="button" disabled={finalized} onClick={() => applySuggestion(visibleSuggestion)}>Adicionar ao rascunho</button><button type="button" onClick={() => setDismissedSuggestions((current) => new Set([...current, problem.id]))}>Ocultar sugestão</button></div>
          </aside> : null}
          <label className={styles.planLabel} htmlFor={textareaId}>Condutas — uma por linha</label>
          <textarea id={textareaId} value={plans[problem.id] ?? ""} disabled={finalized} onChange={(event) => updatePlan(problem.id, event.target.value)} rows={5} placeholder="Uma conduta por linha. Revise clinicamente antes de salvar." />
        </article>;
      })}
    </div>}

    <footer className={styles.footer}>Esta aba é profissional. As orientações destinadas a paciente/família permanecem no relatório familiar e continuam sujeitas às salvaguardas que impedem prescrição ou mudanças automáticas de medicamentos.</footer>
  </section>;
}

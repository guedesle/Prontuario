"use client";

import { useEffect, useMemo, useState } from "react";
import type { VaccinationReview } from "@/domain/vaccination-prevention";
import styles from "./geriatric-conduct-workspace.module.css";

type Problem = {
  id: string;
  type: "CLINICAL" | "GERIATRIC";
  status: "ACTIVE" | "STABLE" | "MONITORING" | "RESOLVED";
  title: string;
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
      setFeedback({ kind: "success", text: "Condutas da consulta geriátrica salvas e sincronizadas com o P — Plano do SOAP." });
      window.dispatchEvent(new CustomEvent("clinical-note-changed", { detail: { consultationId } }));
    } catch (error) {
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível salvar as condutas." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className={styles.card}><p>Carregando condutas…</p></section>;
  if (!view) return <section className={styles.card}><p role="alert">{feedback?.text ?? "Condutas indisponíveis."}</p></section>;

  return <section className={styles.card} aria-labelledby="geriatric-conduct-title">
    <header className={styles.heading}>
      <div>
        <p className={styles.eyebrow}>Área médica · não compartilhada automaticamente</p>
        <h3 id="geriatric-conduct-title">Condutas da consulta geriátrica</h3>
        <p>Defina e revise as condutas orientadas nesta consulta. Este conteúdo usa a mesma fonte do <strong>P — Plano por problema</strong> do SOAP, evitando registros divergentes.</p>
      </div>
      <button type="button" onClick={() => void save()} disabled={!dirty || saving || finalized}>{saving ? "Salvando…" : "Salvar condutas"}</button>
    </header>

    {finalized ? <p className={styles.notice}>Consulta finalizada: condutas em modo somente leitura.</p> : null}
    {dirty ? <p className={styles.notice}>Há condutas ainda não salvas.</p> : null}
    {feedback ? <p className={feedback.kind === "error" ? styles.error : styles.success} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p> : null}

    {activeProblems.length === 0 ? <p className={styles.empty}>Não há problemas ativos confirmados para vincular condutas.</p> : <div className={styles.grid}>
      {activeProblems.map((problem, index) => <label className={styles.problem} key={problem.id}>
        <span><b>{index + 1}. {problem.title}</b><small>{problem.type === "GERIATRIC" ? "Problema geriátrico" : "Problema clínico"} · {problem.status}</small></span>
        <textarea value={plans[problem.id] ?? ""} disabled={finalized} onChange={(event) => updatePlan(problem.id, event.target.value)} rows={5} placeholder="Uma conduta por linha. O médico pode editar livremente após revisão clínica." />
      </label>)}
    </div>}

    <footer className={styles.footer}>Esta aba é profissional. As orientações destinadas a paciente/família permanecem no relatório familiar e passam pelas salvaguardas que removem prescrição e mudanças de medicamentos.</footer>
  </section>;
}

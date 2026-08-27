"use client";

import { useEffect, useMemo, useState } from "react";
import { MEDICATION_MOMENT_LABELS, type MedicationMoment } from "@/domain/medication-plan";
import {
  isExplicitActiveMedication,
  summarizeSoapMedicationProvenance,
} from "@/domain/soap-medication-provenance";
import {
  deriveVaccinationReview,
  GERIATRIC_VACCINE_CHECKLIST,
  type VaccinationReviewStatus,
} from "@/domain/vaccination-prevention";
import {
  renderClinicalExamsText,
  renderCompletedScalesText,
  renderSoapExamsScalesReport,
  type CompletedScaleResult,
} from "@/domain/clinical-copy-report";
import type { ClinicalExamHistoryItem } from "@/domain/consultation-exams";
import { scaleCatalogEntry } from "@/domain/scale-catalog";
import suggestionStyles from "./professional-plan-suggestion.module.css";
import styles from "./soap-editor.module.css";

type Problem = { id: string; type: "CLINICAL" | "GERIATRIC"; status: "ACTIVE" | "STABLE" | "MONITORING" | "RESOLVED"; title: string };
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
  legacyAssessmentPresent?: boolean;
  fields: { subjective?: string; physicalExam?: string; vitalSigns?: string; anthropometry?: string; vaccinationReview?: { status: VaccinationReviewStatus; pendingVaccines?: readonly string[] }; planByProblem?: Record<string, readonly string[]> };
  exams: { current: string; history: ClinicalExamHistoryItem[] };
  problems: Problem[];
  planSuggestions: PlanSuggestion[];
};
type MedicationItem = {
  medicationId: string;
  medicationText: string;
  doseInstruction?: string;
  route?: string;
  moments: MedicationMoment[];
  continuous: boolean;
  instructions?: string;
  status: "ACTIVE" | "SUSPENDED" | "FINISHED" | "UNKNOWN";
  statusSource: "explicit-history" | "current-record-only" | "unknown";
};
type MedicationView = { items: MedicationItem[] };
type ScaleStatusItem = { scaleCode: string; scoreNumeric: number | null; scoreText?: string | null; classification?: string | null; interpretation?: string | null; appliedAt: string };
type ScaleStatusView = { latest: ScaleStatusItem[] };
type Draft = {
  subjective: string;
  physicalExam: string;
  vitalSigns: string;
  anthropometry: string;
  examsText: string;
  vaccinationReviewed: boolean;
  pendingVaccines: string[];
  otherPendingVaccinesText: string;
  planTextByProblem: Record<string, string>;
};

const KNOWN_VACCINE_NAMES = new Set(GERIATRIC_VACCINE_CHECKLIST.map((item) => item.name));

function uniqueTextLines(value: string): string[] {
  return [...new Set(value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
}

function draftFromView(view: NoteView): Draft {
  const review = view.fields.vaccinationReview;
  const pending = [...(review?.pendingVaccines ?? [])];
  return {
    subjective: view.fields.subjective ?? "",
    physicalExam: view.fields.physicalExam ?? "",
    vitalSigns: view.fields.vitalSigns ?? "",
    anthropometry: view.fields.anthropometry ?? "",
    examsText: view.exams.current,
    vaccinationReviewed: review?.status !== undefined && review.status !== "UNKNOWN",
    pendingVaccines: pending.filter((name) => KNOWN_VACCINE_NAMES.has(name)),
    otherPendingVaccinesText: pending.filter((name) => !KNOWN_VACCINE_NAMES.has(name)).join("\n"),
    planTextByProblem: Object.fromEntries(Object.entries(view.fields.planByProblem ?? {}).map(([id, actions]) => [id, actions.join("\n")])),
  };
}
function actionsFromText(value: string): string[] { return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean); }
function valueOrMissing(value: string): string { return value.trim() || "sem dados registrados"; }
function medicationLine(item: MedicationItem): string {
  const parts = [item.medicationText, item.doseInstruction, item.route, item.moments.length ? item.moments.map((moment) => MEDICATION_MOMENT_LABELS[moment]).join(" / ") : undefined, item.instructions].filter(Boolean);
  return `- ${parts.join(" — ")}`;
}
function renderSoap(draft: Draft, problems: Problem[], medications: MedicationItem[]): string {
  const active = problems.filter((problem) => problem.status !== "RESOLVED");
  const activeMedications = medications.filter(isExplicitActiveMedication);
  const lines = ["S — SUBJETIVO", valueOrMissing(draft.subjective), "", "O — OBJETIVO", `Exame físico: ${valueOrMissing(draft.physicalExam)}`, `Sinais vitais: ${valueOrMissing(draft.vitalSigns)}`, `Antropometria: ${valueOrMissing(draft.anthropometry)}`, "Medicações em uso:"];
  if (activeMedications.length === 0) lines.push("- sem dados registrados"); else activeMedications.forEach((item) => lines.push(medicationLine(item)));
  lines.push("", "A — AVALIAÇÃO");
  if (active.length === 0) lines.push("sem problemas ativos registrados"); else active.forEach((problem, index) => lines.push(`${index + 1}. ${problem.title}`));
  lines.push("", "P — PLANO");
  if (active.length === 0) lines.push("sem dados registrados"); else active.forEach((problem, index) => { lines.push(`${index + 1}. ${problem.title}`); const actions = actionsFromText(draft.planTextByProblem[problem.id] ?? ""); if (actions.length === 0) lines.push("- sem dados registrados"); else actions.forEach((action) => lines.push(`- ${action}`)); });
  return lines.join("\n");
}

export function SoapEditor({ consultationId }: { consultationId: string }) {
  const [view, setView] = useState<NoteView | null>(null);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [medicationLoadState, setMedicationLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [scaleResults, setScaleResults] = useState<ScaleStatusItem[]>([]);
  const [scaleLoadState, setScaleLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function load(options: { preserveDismissed?: boolean } = {}) {
    setLoading(true); setFeedback(null);
    try {
      const response = await fetch(`/api/consultations/${consultationId}/note`, { cache: "no-store" });
      const body = await response.json().catch(() => null) as (NoteView & { message?: string }) | null;
      if (!response.ok || !body) throw new Error(body?.message || "Não foi possível carregar o SOAP.");
      setView(body); setDraft(draftFromView(body)); setDirty(false);
      if (!options.preserveDismissed) setDismissedSuggestions(new Set());
    } catch (error) { setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível carregar o SOAP." }); }
    finally { setLoading(false); }
  }
  async function loadMedications() {
    setMedicationLoadState("loading");
    try {
      const response = await fetch(`/api/consultations/${consultationId}/medications`, { cache: "no-store" });
      const body = await response.json().catch(() => null) as (MedicationView & { message?: string }) | null;
      if (!response.ok || !body) throw new Error(body?.message || "Não foi possível carregar as medicações.");
      setMedications(body.items); setMedicationLoadState("ready");
    } catch (error) {
      setMedications([]); setMedicationLoadState("error");
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível carregar as medicações." });
    }
  }

  async function loadScaleResults() {
    setScaleLoadState("loading");
    try {
      const response = await fetch(`/api/consultations/${consultationId}/scales/status`, { cache: "no-store" });
      const body = await response.json().catch(() => null) as (ScaleStatusView & { message?: string }) | null;
      if (!response.ok || !body) throw new Error(body?.message || "Não foi possível carregar os resultados das escalas.");
      setScaleResults(body.latest); setScaleLoadState("ready");
    } catch (error) {
      setScaleResults([]); setScaleLoadState("error");
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível carregar os resultados das escalas." });
    }
  }

  useEffect(() => { void load(); void loadMedications(); void loadScaleResults(); }, [consultationId]);
  useEffect(() => {
    function onProblemsChanged(event: Event) {
      const detail = (event as CustomEvent<{ consultationId?: string }>).detail;
      if (detail?.consultationId !== consultationId) return;
      if (dirty) { setFeedback({ kind: "error", text: "A lista de problemas mudou enquanto há alterações não salvas no SOAP. Salve ou recarregue antes de continuar o plano." }); return; }
      void load();
    }
    function onMedicationsChanged(event: Event) {
      const detail = (event as CustomEvent<{ consultationId?: string }>).detail;
      if (detail?.consultationId === consultationId) void loadMedications();
    }
    function onScalesChanged(event: Event) {
      const detail = (event as CustomEvent<{ consultationId?: string }>).detail;
      if (detail?.consultationId !== consultationId) return;
      void loadScaleResults();
      if (dirty) { setFeedback({ kind: "error", text: "Uma escala foi atualizada enquanto o SOAP possui alterações não salvas. Salve ou recarregue o SOAP antes de atualizar sugestões." }); return; }
      void load();
    }
    window.addEventListener("clinical-problems-changed", onProblemsChanged);
    window.addEventListener("clinical-medications-changed", onMedicationsChanged);
    window.addEventListener("clinical-scales-changed", onScalesChanged);
    return () => {
      window.removeEventListener("clinical-problems-changed", onProblemsChanged);
      window.removeEventListener("clinical-medications-changed", onMedicationsChanged);
      window.removeEventListener("clinical-scales-changed", onScalesChanged);
    };
  }, [consultationId, dirty]);

  const activeProblems = useMemo(() => (view?.problems ?? []).filter((problem) => problem.status !== "RESOLVED"), [view]);
  const medicationProvenance = useMemo(() => summarizeSoapMedicationProvenance(medications), [medications]);
  const completedScaleResults = useMemo<CompletedScaleResult[]>(() => scaleResults.map((result) => ({
    scaleCode: result.scaleCode,
    scaleName: scaleCatalogEntry(result.scaleCode).shortName,
    scoreNumeric: result.scoreNumeric,
    scoreText: result.scoreText ?? undefined,
    classification: result.classification ?? undefined,
    interpretation: result.interpretation ?? undefined,
    appliedAt: result.appliedAt,
  })), [scaleResults]);
  const completedScalesText = useMemo(() => renderCompletedScalesText(completedScaleResults), [completedScaleResults]);
  const canCopySoap = medicationLoadState === "ready";
  const canCopyCombined = canCopySoap && scaleLoadState === "ready";
  const canCopyExams = Boolean(draft?.examsText.trim() || view?.exams.history.length);
  const canCopyScales = scaleLoadState === "ready" && Boolean(completedScalesText);
  function setField<K extends "subjective" | "physicalExam" | "vitalSigns" | "anthropometry" | "examsText" | "otherPendingVaccinesText">(key: K, value: Draft[K]) { setDraft((current) => current ? { ...current, [key]: value } : current); setDirty(true); setFeedback(null); }
  function setVaccinationReviewed(checked: boolean) {
    setDraft((current) => current ? {
      ...current,
      vaccinationReviewed: checked,
      ...(checked ? {} : { pendingVaccines: [], otherPendingVaccinesText: "" }),
    } : current);
    setDirty(true); setFeedback(null);
  }
  function setVaccinePending(name: string, checked: boolean) {
    setDraft((current) => {
      if (!current) return current;
      const pending = new Set(current.pendingVaccines);
      if (checked) pending.add(name); else pending.delete(name);
      return { ...current, vaccinationReviewed: true, pendingVaccines: [...pending] };
    });
    setDirty(true); setFeedback(null);
  }
  function setProblemPlan(problemId: string, value: string) { setDraft((current) => current ? { ...current, planTextByProblem: { ...current.planTextByProblem, [problemId]: value } } : current); setDirty(true); setFeedback(null); }
  function applySuggestion(suggestion: PlanSuggestion) {
    if (!draft) return;
    const existing = actionsFromText(draft.planTextByProblem[suggestion.problemId] ?? "");
    const merged = [...existing];
    for (const action of suggestion.actions) if (!merged.includes(action)) merged.push(action);
    setProblemPlan(suggestion.problemId, merged.join("\n"));
    setDismissedSuggestions((current) => new Set([...current, suggestion.problemId]));
    setFeedback({ kind: "success", text: "Sugestão adicionada somente ao rascunho local do SOAP. Revise e edite antes de salvar." });
  }
  function dismissSuggestion(problemId: string) {
    setDismissedSuggestions((current) => new Set([...current, problemId]));
  }

  async function save() {
    if (!view || !draft || saving || view.consultationStatus === "FINALIZED") return;
    setSaving(true); setFeedback(null);
    try {
      const planByProblem = Object.fromEntries(activeProblems.map((problem) => [problem.id, actionsFromText(draft.planTextByProblem[problem.id] ?? "")]));
      const vaccinationReview = deriveVaccinationReview({
        reviewed: draft.vaccinationReviewed,
        pendingVaccines: [...draft.pendingVaccines, ...uniqueTextLines(draft.otherPendingVaccinesText)],
      });
      const response = await fetch(`/api/consultations/${consultationId}/note`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedUpdatedAt: view.updatedAt, expectedNoteVersion: view.noteVersion, subjective: draft.subjective, physicalExam: draft.physicalExam, vitalSigns: draft.vitalSigns, anthropometry: draft.anthropometry, examsText: draft.examsText, vaccinationReview, planByProblem }) });
      const body = await response.json().catch(() => null) as (NoteView & { message?: string }) | null;
      if (!response.ok || !body) throw new Error(body?.message || "Não foi possível salvar o SOAP.");
      setView(body); setDraft(draftFromView(body)); setDirty(false); setFeedback({ kind: "success", text: "SOAP, exames, vacinas e condutas salvos nesta consulta." });
      window.dispatchEvent(new CustomEvent("clinical-note-changed", { detail: { consultationId } }));
    } catch (error) { setFeedback({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível salvar o SOAP." }); }
    finally { setSaving(false); }
  }
  async function copyText(text: string, success: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("clipboard-api-unavailable");
      }
      setFeedback({ kind: "success", text: success });
      return;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("copy-command-failed");
        setFeedback({ kind: "success", text: success });
      } catch {
        setFeedback({ kind: "error", text: "Não foi possível copiar automaticamente neste navegador. Selecione o texto ou abra o prontuário no Safari/Chrome e tente novamente." });
      }
    }
  }
  async function copyCombinedReport() {
    if (!draft || !view || !canCopyCombined) return;
    await copyText(renderSoapExamsScalesReport({ soap: renderSoap(draft, view.problems, medications), currentExams: draft.examsText, examHistory: view.exams.history, scaleResults: completedScaleResults }), "SOAP, exames e resultados das escalas copiados para a área de transferência.");
  }
  async function copySoap() {
    if (!draft || !view || !canCopySoap) return;
    await copyText(renderSoap(draft, view.problems, medications), "SOAP copiado para a área de transferência.");
  }
  async function copyExams() {
    if (!draft || !view || !canCopyExams) return;
    await copyText(renderClinicalExamsText({ current: draft.examsText, history: view.exams.history }), "Exames copiados para a área de transferência.");
  }
  async function copyScales() {
    if (!canCopyScales) return;
    await copyText(completedScalesText, "Resultados das escalas preenchidas copiados para a área de transferência.");
  }

  if (loading) return <section className={styles.card}><p>Carregando SOAP…</p></section>;
  if (!view || !draft) return <section className={styles.card}><p role="alert">{feedback?.text ?? "SOAP indisponível."}</p></section>;
  const finalized = view.consultationStatus === "FINALIZED";
  const routineVaccines = GERIATRIC_VACCINE_CHECKLIST.filter((item) => item.group === "ROTINA");
  const specialVaccines = GERIATRIC_VACCINE_CHECKLIST.filter((item) => item.group === "SITUACOES_ESPECIAIS");
  const derivedVaccinationStatus = deriveVaccinationReview({ reviewed: draft.vaccinationReviewed, pendingVaccines: [...draft.pendingVaccines, ...uniqueTextLines(draft.otherPendingVaccinesText)] }).status;

  return <section className={styles.card} aria-labelledby="soap-editor-title">
    <div className={styles.heading}><div><p className="eyebrow">Prontuário</p><h2 id="soap-editor-title">Evolução SOAP</h2><p className={styles.muted}>Avaliação usa problemas confirmados; Objetivo incorpora {medicationProvenance.explicitActiveCount} medicamento(s) em uso com status explicitamente reconciliado nesta trajetória.</p></div><div className={styles.actions}><button type="button" onClick={save} disabled={!dirty || saving || finalized}>{saving ? "Salvando…" : "Salvar SOAP e exames"}</button></div></div>
    {finalized ? <p className={styles.locked} role="status">Consulta finalizada: o SOAP está em modo somente leitura.</p> : null}
    {dirty ? <p className={styles.unsaved} role="status">Há alterações ainda não salvas. A cópia usa o conteúdo atual da tela; salvar grava a versão nesta consulta.</p> : null}
    {view.legacyAssessmentPresent ? <p className={styles.unsaved} role="status">Há conteúdo legado no campo Avaliação. Ele permanece preservado no banco e não é sobrescrito por este editor; revise o histórico antes de finalizar.</p> : null}
    {medicationLoadState === "loading" ? <p className={styles.unsaved} role="status">Carregando reconciliação medicamentosa para compor a cópia do SOAP…</p> : null}
    {medicationLoadState === "error" ? <p className={styles.error} role="alert">A cópia do SOAP está temporariamente indisponível porque a lista de medicações não pôde ser carregada.</p> : null}
    {medicationLoadState === "ready" && medicationProvenance.pendingReviewCount > 0 ? <p className={styles.unsaved} role="status">{medicationProvenance.pendingReviewCount} medicamento(s) ainda exigem reconciliação explícita. Eles serão omitidos da cópia até revisão; isso não bloqueia SOAP, exames ou escalas.</p> : null}
    {scaleLoadState === "error" ? <p className={styles.error} role="alert">A cópia combinada está bloqueada porque os resultados das escalas não puderam ser carregados; SOAP e exames continuam disponíveis separadamente.</p> : null}
    {feedback ? <p className={feedback.kind === "error" ? styles.error : styles.success} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p> : null}
    <aside className={styles.copyPanel} aria-labelledby="clinical-copy-title">
      <div><strong id="clinical-copy-title">Cópia para o prontuário</strong><span>O relatório combinado inclui o SOAP, os exames visíveis e somente os resultados das escalas preenchidas nesta consulta.</span></div>
      <div className={styles.copyActions}>
        <button type="button" onClick={copyCombinedReport} disabled={!canCopyCombined}>Copiar SOAP + exames + escalas</button>
        <button type="button" onClick={copySoap} disabled={!canCopySoap}>Copiar SOAP</button>
        <button type="button" onClick={copyExams} disabled={!canCopyExams}>Copiar exames</button>
        <button type="button" onClick={copyScales} disabled={!canCopyScales}>Copiar escalas preenchidas</button>
      </div>
    </aside>
    <div className={styles.soapGrid}>
      <section className={styles.soapSection}><h3>S — Subjetivo</h3><label>Motivo da consulta, HDA e informações da paciente/acompanhante<textarea value={draft.subjective} disabled={finalized} onChange={(event) => setField("subjective", event.target.value)} rows={7} /></label></section>
      <section className={styles.soapSection}><h3>O — Objetivo</h3><label>Exame físico<textarea value={draft.physicalExam} disabled={finalized} onChange={(event) => setField("physicalExam", event.target.value)} rows={4} /></label><label>Sinais vitais<textarea value={draft.vitalSigns} disabled={finalized} onChange={(event) => setField("vitalSigns", event.target.value)} rows={3} /></label><label>Antropometria<textarea value={draft.anthropometry} disabled={finalized} onChange={(event) => setField("anthropometry", event.target.value)} rows={3} /></label>
        <fieldset><legend>Vacinas e prevenção</legend>
          <label className={styles.checkRow}><input type="checkbox" checked={draft.vaccinationReviewed} disabled={finalized} onChange={(event) => setVaccinationReviewed(event.target.checked)} /><span>Carteira/status vacinal revisado nesta consulta</span></label>
          <p className={styles.muted}>Marque abaixo apenas as vacinas identificadas como pendentes após a revisão. O sistema deriva o status automaticamente: nenhuma revisão = desconhecido; revisão sem pendências = sem pendências; qualquer checkbox pendente = vacinas pendentes.</p>
          <strong>Rotina no calendário do idoso</strong>
          <div className={styles.copyActions}>{routineVaccines.map((item) => <label key={item.id} className={styles.checkRow}><input type="checkbox" checked={draft.pendingVaccines.includes(item.name)} disabled={finalized} onChange={(event) => setVaccinePending(item.name, event.target.checked)} /><span><b>{item.name}</b><small>{item.note}</small></span></label>)}</div>
          <strong>Situações especiais</strong>
          <div className={styles.copyActions}>{specialVaccines.map((item) => <label key={item.id} className={styles.checkRow}><input type="checkbox" checked={draft.pendingVaccines.includes(item.name)} disabled={finalized} onChange={(event) => setVaccinePending(item.name, event.target.checked)} /><span><b>{item.name}</b><small>{item.note}</small></span></label>)}</div>
          <label>Outras pendências vacinais documentadas — uma por linha<textarea value={draft.otherPendingVaccinesText} disabled={finalized} onChange={(event) => { setDraft((current) => current ? { ...current, vaccinationReviewed: true, otherPendingVaccinesText: event.target.value } : current); setDirty(true); setFeedback(null); }} rows={3} /></label>
          <p className={styles.muted}>Status que será salvo: <strong>{derivedVaccinationStatus === "PENDING" ? "Vacinas pendentes registradas" : derivedVaccinationStatus === "UP_TO_DATE" ? "Sem pendências registradas" : "Status desconhecido"}</strong>. Checklist baseado no calendário SBIm Idoso 2026/2027; não gera prescrição, produto, dose ou esquema automático.</p>
        </fieldset><p className={styles.muted}>Medicações em uso entram automaticamente apenas na cópia do SOAP quando o status deriva de histórico explicitamente reconciliado; não são duplicadas neste JSON.</p></section>
      <section className={`${styles.soapSection} ${styles.examSection}`} aria-labelledby="clinical-exams-title"><div className={styles.examHeading}><h3 id="clinical-exams-title">Exames laboratoriais e de imagem</h3><p className={styles.muted}>O registro atual permanece separado; os exames anteriores aparecem somente como contexto longitudinal.</p></div><div className={styles.examLayout}><label>Exames desta consulta<textarea value={draft.examsText} disabled={finalized} onChange={(event) => setField("examsText", event.target.value)} rows={8} placeholder="Registre a data, o tipo de exame e os resultados relevantes." /></label><div>{view.exams.history.length > 0 ? <div className={styles.examHistory} aria-label="Exames de consultas anteriores"><strong>Exames de consultas anteriores</strong>{view.exams.history.map((item) => <article key={item.id}><time dateTime={item.consultationOccurredAt}>{new Date(item.consultationOccurredAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</time><p>{item.content}</p></article>)}</div> : <p className={styles.emptyHistory}>Nenhum exame registrado em consultas anteriores.</p>}</div></div></section>
      <section className={styles.soapSection}><h3>A — Avaliação</h3>{activeProblems.length === 0 ? <p className={styles.muted}>Sem problemas ativos registrados.</p> : <ol className={styles.problemList}>{activeProblems.map((problem) => <li key={problem.id}><strong>{problem.title}</strong><span>{problem.type === "GERIATRIC" ? "Problema geriátrico" : "Problema clínico"} · {problem.status}</span></li>)}</ol>}</section>
      <section className={styles.soapSection}><h3>P — Plano por problema</h3>{activeProblems.length === 0 ? <p className={styles.muted}>Cadastre/confirme problemas para vincular condutas.</p> : activeProblems.map((problem) => {
        const suggestion = view.planSuggestions.find((item) => item.problemId === problem.id);
        const visibleSuggestion = suggestion && !dismissedSuggestions.has(problem.id) ? suggestion : null;
        return <div key={problem.id} className={styles.planField}>
          <strong>{problem.title}</strong>
          <span>Uma ação por linha. Nada é aplicado automaticamente.</span>
          {visibleSuggestion ? <aside className={suggestionStyles.card} aria-label={`Sugestão de plano para ${problem.title}`}>
            <div className={suggestionStyles.header}><strong>Sugestão baseada na avaliação desta consulta</strong><span className={suggestionStyles.badge}>Rascunho · revisão médica</span></div>
            <p className={suggestionStyles.evidence}>Origem: {visibleSuggestion.evidence.map((item) => `${item.scaleCode} ${item.scoreText}${item.classification ? ` — ${item.classification}` : ""}`).join("; ")}.</p>
            <ul className={suggestionStyles.actionsList}>{visibleSuggestion.actions.map((action) => <li key={action}>{action}</li>)}</ul>
            <p className={suggestionStyles.sources}>Fontes: {visibleSuggestion.sources.map((source) => `${source.label} (PMID ${source.pmid})`).join("; ")}.</p>
            <div className={suggestionStyles.controls}><button type="button" disabled={finalized} onClick={() => applySuggestion(visibleSuggestion)}>Adicionar ao rascunho</button><button type="button" onClick={() => dismissSuggestion(problem.id)}>Ocultar sugestão</button></div>
          </aside> : null}
          <textarea aria-label={`Plano para ${problem.title}`} value={draft.planTextByProblem[problem.id] ?? ""} disabled={finalized} onChange={(event) => setProblemPlan(problem.id, event.target.value)} rows={4} />
        </div>;
      })}</section>
    </div>
  </section>;
}

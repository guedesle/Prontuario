"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { canSubmitProblemStatusChange, type ProblemStatus } from "@/domain/problem-status-review";
import styles from "./problem-workspace.module.css";

type ProblemType = "CLINICAL" | "GERIATRIC";

type Problem = {
  id: string;
  type: ProblemType;
  status: ProblemStatus;
  title: string;
  description?: string;
  canDelete: boolean;
};

type WorkspaceView = {
  consultationId: string;
  consultationStatus: "DRAFT" | "IN_REVIEW" | "FINALIZED";
  isLatestConsultation: boolean;
  problems: Problem[];
};

const STATUS_LABELS: Record<ProblemStatus, string> = {
  ACTIVE: "Ativo",
  STABLE: "Estável",
  MONITORING: "Em acompanhamento",
  RESOLVED: "Resolvido",
};

const GERIATRIC_PRESETS = [
  "Fragilidade",
  "Sarcopenia",
  "Quedas",
  "Comprometimento cognitivo e demência",
  "Delirium",
  "Incontinência urinária e fecal",
  "Imobilidade e dependência funcional",
  "Depressão e isolamento social",
  "Desnutrição/perda de peso não intencional e anorexia do envelhecimento",
  "Comprometimento multissensorial — perda visual, auditiva, olfativa, gustativa e tátil",
  "Polifarmácia — uso de ≥5 medicamentos",
  "Multimorbidade — presença de ≥2 condições crônicas",
  "Úlceras de pressão",
] as const;

function ProblemCard({
  problem,
  editable,
  onChangeStatus,
  onDelete,
}: {
  problem: Problem;
  editable: boolean;
  onChangeStatus: (problemId: string, newStatus: ProblemStatus) => Promise<void>;
  onDelete: (problemId: string) => Promise<void>;
}) {
  const [nextStatus, setNextStatus] = useState<ProblemStatus>(problem.status);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNextStatus(problem.status);
    setReviewConfirmed(false);
  }, [problem.status]);

  const canSubmit = canSubmitProblemStatusChange({
    editable,
    saving,
    currentStatus: problem.status,
    nextStatus,
    reviewConfirmed,
  });

  async function updateStatus() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await onChangeStatus(problem.id, nextStatus);
      setReviewConfirmed(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o problema.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCurrentProblem() {
    if (!editable || !problem.canDelete || deleting) return;
    const confirmed = window.confirm("Excluir este problema incluído nesta consulta? O registro de auditoria será preservado.");
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(problem.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir o problema desta consulta.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className={styles.problem} data-resolved={problem.status === "RESOLVED"}>
      <div className={styles.problemHeading}>
        <strong>{problem.title}</strong>
        <span>{STATUS_LABELS[problem.status]}</span>
      </div>
      {problem.description ? <p>{problem.description}</p> : null}
      {editable ? (
        <div className={styles.statusControls}>
          <label>
            Situação do problema
            <select
              value={nextStatus}
              onChange={(event) => {
                setNextStatus(event.target.value as ProblemStatus);
                setReviewConfirmed(false);
              }}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {nextStatus !== problem.status ? (
            <label className={styles.reviewConfirmation}>
              <input
                type="checkbox"
                checked={reviewConfirmed}
                onChange={(event) => setReviewConfirmed(event.target.checked)}
              />
              <span>Confirmo que revisei clinicamente esta alteração.</span>
            </label>
          ) : null}
          <button type="button" onClick={updateStatus} disabled={!canSubmit}>
            {saving ? "Salvando…" : "Salvar alteração"}
          </button>
          {problem.canDelete ? (
            <button type="button" className={styles.deleteButton} onClick={deleteCurrentProblem} disabled={saving || deleting}>
              {deleting ? "Excluindo…" : "Excluir inclusão"}
            </button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </article>
  );
}

export function ProblemWorkspace({ consultationId }: { consultationId: string }) {
  const [view, setView] = useState<WorkspaceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ProblemType>("CLINICAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/consultations/${consultationId}/problems`, { cache: "no-store" });
      const body = await response.json().catch(() => null) as (WorkspaceView & { message?: string }) | null;
      if (!response.ok || !body) throw new Error(body?.message || "Não foi possível carregar os problemas.");
      setView(body);
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : "Não foi possível carregar os problemas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [consultationId]);

  const editable = Boolean(view && view.consultationStatus !== "FINALIZED" && view.isLatestConsultation);
  const clinical = useMemo(() => (view?.problems ?? []).filter((problem) => problem.type === "CLINICAL"), [view]);
  const geriatric = useMemo(() => (view?.problems ?? []).filter((problem) => problem.type === "GERIATRIC"), [view]);

  function applyView(next: WorkspaceView) {
    setView(next);
    setFeedback(null);
    window.dispatchEvent(new CustomEvent("clinical-problems-changed", { detail: { consultationId } }));
  }

  async function requestUpdate(body: unknown): Promise<WorkspaceView> {
    const response = await fetch(`/api/consultations/${consultationId}/problems`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const parsed = await response.json().catch(() => null) as (WorkspaceView & { message?: string }) | null;
    if (!response.ok || !parsed) throw new Error(parsed?.message || "Não foi possível atualizar a lista de problemas.");
    return parsed;
  }

  async function changeStatus(problemId: string, newStatus: ProblemStatus) {
    const next = await requestUpdate({ action: "status", problemId, newStatus });
    applyView(next);
    setStatusMessage("Alteração salva. O histórico do problema foi preservado.");
  }

  async function deleteProblem(problemId: string) {
    const next = await requestUpdate({ action: "delete", problemId });
    applyView(next);
    setStatusMessage("Inclusão removida desta consulta. O registro de auditoria foi preservado.");
  }

  function selectGeriatricPreset(preset: typeof GERIATRIC_PRESETS[number]) {
    setType("GERIATRIC");
    setTitle(preset);
    setStatusMessage(null);
    window.requestAnimationFrame(() => titleInputRef.current?.focus());
  }

  async function create() {
    if (!editable || !title.trim() || saving) return;
    const problemTitle = title.trim();
    setSaving(true);
    setFeedback(null);
    setStatusMessage(null);
    try {
      const next = await requestUpdate({
        action: "create",
        type,
        title: problemTitle,
        description: description.trim() || undefined,
      });
      applyView(next);
      setTitle("");
      setDescription("");
      setStatusMessage(`${problemTitle} foi incluído na lista. Revise a situação clínica quando necessário.`);
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : "Não foi possível criar o problema.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className={styles.card}><p>Carregando lista de problemas…</p></section>;
  if (!view) return <section className={styles.card}><p role="alert">{feedback ?? "Lista de problemas indisponível."}</p></section>;

  return (
    <section className={styles.card} aria-labelledby="problem-workspace-title">
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">Linha de cuidado</p>
          <h2 id="problem-workspace-title">Lista longitudinal de problemas</h2>
          <p>Registre os problemas relevantes para o acompanhamento. Problemas resolvidos continuam visíveis no histórico e sugestões automáticas só entram na lista após confirmação médica.</p>
        </div>
      </div>

      {!view.isLatestConsultation ? (
        <p className={styles.notice} role="status">Consulta anterior: a lista mostra a situação registrada naquele momento e não permite alterações retrospectivas.</p>
      ) : null}
      {view.consultationStatus === "FINALIZED" ? (
        <p className={styles.notice} role="status">Consulta finalizada: a lista está disponível apenas para leitura.</p>
      ) : null}
      {feedback ? <p className={styles.error} role="alert">{feedback}</p> : null}
      {statusMessage ? <p className={styles.success} role="status" aria-live="polite">{statusMessage}</p> : null}

      {editable ? (
        <div className={styles.creator}>
          <div className={styles.creatorIntro}>
            <div>
              <strong>Adicionar problema</strong>
              <span>Use um atalho geriátrico ou escreva um problema clínico. Nada é incluído automaticamente.</span>
            </div>
          </div>

          <div className={styles.presets} aria-labelledby="geriatric-presets-title">
            <div className={styles.presetsHeader}>
              <strong id="geriatric-presets-title">Problemas geriátricos frequentes</strong>
              <span>Selecione um item para preencher o campo. Revise o texto antes de adicionar.</span>
            </div>
            <div className={styles.presetGrid}>
              {GERIATRIC_PRESETS.map((preset) => {
                const selected = type === "GERIATRIC" && title === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={selected}
                    className={selected ? styles.presetSelected : undefined}
                    onClick={() => selectGeriatricPreset(preset)}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.creatorFields}>
            <label>
              Categoria
              <select value={type} onChange={(event) => setType(event.target.value as ProblemType)}>
                <option value="CLINICAL">Problema clínico</option>
                <option value="GERIATRIC">Problema geriátrico</option>
              </select>
            </label>
            <label className={styles.titleField}>
              Problema
              <input ref={titleInputRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Hipertensão arterial" maxLength={500} aria-describedby="problem-title-help" />
              <small id="problem-title-help">Confirme o termo antes de adicionar à lista longitudinal.</small>
            </label>
            <label className={styles.descriptionField}>
              Contexto opcional
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Observação breve, sem repetir a história clínica" />
            </label>
            <button type="button" onClick={create} disabled={!title.trim() || saving}>{saving ? "Adicionando…" : "Adicionar à lista"}</button>
          </div>
        </div>
      ) : null}

      <div className={styles.columns}>
        <section aria-labelledby="clinical-problems-title">
          <h3 id="clinical-problems-title">Problemas clínicos</h3>
          {clinical.length === 0 ? <p className={styles.empty}>Sem problemas clínicos registrados.</p> : clinical.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} editable={editable} onChangeStatus={changeStatus} onDelete={deleteProblem} />
          ))}
        </section>
        <section aria-labelledby="geriatric-problems-title">
          <h3 id="geriatric-problems-title">Problemas geriátricos</h3>
          {geriatric.length === 0 ? <p className={styles.empty}>Sem problemas geriátricos registrados.</p> : geriatric.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} editable={editable} onChangeStatus={changeStatus} onDelete={deleteProblem} />
          ))}
        </section>
      </div>
    </section>
  );
}

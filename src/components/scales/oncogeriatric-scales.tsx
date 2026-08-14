"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ECOG_OPTIONS,
  scoreCrashMnaSf,
  scoreEcog,
  type CrashMnaSfInput,
} from "@/domain/oncogeriatric-scales";

type Tab = "ecog" | "crash";
type PreviousAssessment = { assessmentId: string; scaleVersion: string; score: number | null; appliedAt: string; consultationId: string } | null;
type Prefills = { meem: PreviousAssessment; mnaSf: PreviousAssessment; ecog: PreviousAssessment };

function numberOrNaN(value: string) {
  return value.trim() === "" ? Number.NaN : Number(value);
}

function PrefillNote({ assessment }: { assessment: PreviousAssessment }) {
  if (!assessment) return null;
  return <small className="prefill-note">Carregado da avaliação de {new Date(assessment.appliedAt).toLocaleDateString("pt-BR")}; confirme antes de salvar.</small>;
}

export function OncogeriatricScales({ consultationId }: { consultationId: string }) {
  const [tab, setTab] = useState<Tab>("ecog");
  const [prefills, setPrefills] = useState<Prefills>({ meem: null, mnaSf: null, ecog: null });
  const [ecog, setEcog] = useState("");
  const [chemotherapyRisk, setChemotherapyRisk] = useState("");
  const [diastolicBloodPressure, setDiastolicBloodPressure] = useState("");
  const [iadlScore, setIadlScore] = useState("");
  const [ldh, setLdh] = useState("");
  const [mmseScore, setMmseScore] = useState("");
  const [mnaSfScore, setMnaSfScore] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/consultations/${consultationId}/scales/oncogeriatrics`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? "Falha ao carregar avaliações prévias.");
        return body as Prefills;
      })
      .then((data) => {
        if (!active) return;
        setPrefills(data);
        if (data.ecog?.score !== null && data.ecog?.score !== undefined) setEcog(String(data.ecog.score));
        if (data.meem?.score !== null && data.meem?.score !== undefined) setMmseScore(String(data.meem.score));
        if (data.mnaSf?.score !== null && data.mnaSf?.score !== undefined) setMnaSfScore(String(data.mnaSf.score));
      })
      .catch((error) => active && setMessage(error instanceof Error ? error.message : "Falha ao carregar avaliações prévias."));
    return () => { active = false; };
  }, [consultationId]);

  const ecogResult = useMemo(() => scoreEcog(ecog), [ecog]);
  const crash = useMemo(() => {
    try {
      if ([chemotherapyRisk, diastolicBloodPressure, iadlScore, ldh, ecog, mmseScore, mnaSfScore].some((value) => value === "")) return null;
      return scoreCrashMnaSf({
        chemotherapyRisk: numberOrNaN(chemotherapyRisk) as 0 | 1 | 2,
        diastolicBloodPressure: numberOrNaN(diastolicBloodPressure),
        iadlScore: numberOrNaN(iadlScore),
        ldh: numberOrNaN(ldh),
        ecog: numberOrNaN(ecog) as 0 | 1 | 2 | 3 | 4,
        mmseScore: numberOrNaN(mmseScore),
        mnaSfScore: numberOrNaN(mnaSfScore),
      });
    } catch {
      return null;
    }
  }, [chemotherapyRisk, diastolicBloodPressure, iadlScore, ldh, ecog, mmseScore, mnaSfScore]);

  async function save(body: Record<string, unknown>) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/consultations/${consultationId}/scales/oncogeriatrics`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Não foi possível salvar a avaliação.");
      setMessage("Avaliação salva. O resultado permanece sujeito à revisão médica.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a avaliação.");
    } finally {
      setSaving(false);
    }
  }

  function saveCrash() {
    if (!crash) return;
    return save({
      scaleCode: "crash_mna_sf",
      chemotherapyRisk: numberOrNaN(chemotherapyRisk),
      diastolicBloodPressure: numberOrNaN(diastolicBloodPressure),
      iadlScore: numberOrNaN(iadlScore),
      ldh: numberOrNaN(ldh),
      ecog: numberOrNaN(ecog),
      mmseScore: numberOrNaN(mmseScore),
      mnaSfScore: numberOrNaN(mnaSfScore),
    });
  }

  return (
    <section className="oncogeriatric-workspace" aria-labelledby="oncogeriatria-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Dimensão clínica</p>
          <h2 id="oncogeriatria-title">Oncogeriatria</h2>
        </div>
        <span className="muted">Selecione, revise e salve</span>
      </div>

      <div className="scale-tabs" role="tablist" aria-label="Escalas oncogeriátricas">
        <button type="button" role="tab" aria-selected={tab === "ecog"} className={tab === "ecog" ? "active" : ""} onClick={() => setTab("ecog")}>ECOG</button>
        <button type="button" role="tab" aria-selected={tab === "crash"} className={tab === "crash" ? "active" : ""} onClick={() => setTab("crash")}>CRASH adaptada — MNA-SF</button>
      </div>

      {tab === "ecog" ? (
        <article className="scale-entry-panel" role="tabpanel">
          <h3>Escala de Estado de Desempenho ECOG</h3>
          <div className="ecog-options">
            {ECOG_OPTIONS.map((option) => (
              <label key={option.value} className={ecog === String(option.value) ? "selected" : ""}>
                <input type="radio" name="ecog" value={option.value} checked={ecog === String(option.value)} onChange={(event) => setEcog(event.target.value)} />
                <strong>{option.value}</strong><span>{option.label}</span>
              </label>
            ))}
          </div>
          <PrefillNote assessment={prefills.ecog} />
          {ecogResult.score !== null && <div className={`scale-result result-${ecogResult.cor}`}><strong>{ecogResult.scoreText}</strong><span>{ecogResult.classe}</span></div>}
          <button type="button" disabled={saving || ecogResult.score === null} onClick={() => save({ scaleCode: "ecog", ecog: numberOrNaN(ecog) })}>Salvar ECOG</button>
          <p className="source-note">Fonte: Oken et al., 1982; ECOG-ACRIN Performance Status Scale.</p>
        </article>
      ) : (
        <article className="scale-entry-panel" role="tabpanel">
          <h3>CRASH adaptada — MNA-SF</h3>
          <div className="clinical-caution">
            <strong>Adaptação institucional sem validação externa.</strong>
            <span>Substitui o MNA completo por MNA-SF: 12–14 = 0 ponto; 0–11 = 2 pontos. Não usar isoladamente para decidir tratamento.</span>
          </div>
          <div className="crash-grid">
            <label>Risco do esquema (Chemotox)
              <select value={chemotherapyRisk} onChange={(event) => setChemotherapyRisk(event.target.value)}>
                <option value="">Selecione</option><option value="0">0</option><option value="1">1</option><option value="2">2</option>
              </select>
              <small>Confirme conforme o esquema proposto. <a href="https://www.mdapp.co/crash-calculator-chemotherapy-risk-assessment-scale-for-high-age-patients-653/" target="_blank" rel="noreferrer">Consultar referência</a></small>
            </label>
            <label>Pressão diastólica (mmHg)<input type="number" min="1" max="250" value={diastolicBloodPressure} onChange={(event) => setDiastolicBloodPressure(event.target.value)} /></label>
            <label>AIVD específica da CRASH (10–29)<input type="number" min="10" max="29" value={iadlScore} onChange={(event) => setIadlScore(event.target.value)} /><small>Não preenchida pela Lawton 7–21, pois os instrumentos não são intercambiáveis.</small></label>
            <label>LDH (U/L)<input type="number" min="0" value={ldh} onChange={(event) => setLdh(event.target.value)} /></label>
            <label>ECOG (0–4)<select value={ecog} onChange={(event) => setEcog(event.target.value)}><option value="">Selecione</option>{ECOG_OPTIONS.slice(0, 5).map((option) => <option value={option.value} key={option.value}>{option.value}</option>)}</select><PrefillNote assessment={prefills.ecog} /></label>
            <label>MEEM (0–30)<input type="number" min="0" max="30" value={mmseScore} onChange={(event) => setMmseScore(event.target.value)} /><PrefillNote assessment={prefills.meem} /></label>
            <label>MNA-SF (0–14)<input type="number" min="0" max="14" value={mnaSfScore} onChange={(event) => setMnaSfScore(event.target.value)} /><PrefillNote assessment={prefills.mnaSf} /></label>
          </div>
          {crash ? (
            <div className={`crash-result result-${crash.cor}`}>
              <div><span>Hematológico</span><strong>{crash.hematologicScore}</strong><small>{crash.hematologicCategory}</small></div>
              <div><span>Não hematológico</span><strong>{crash.nonHematologicScore}</strong><small>{crash.nonHematologicCategory}</small></div>
              <div><span>Combinado</span><strong>{crash.combinedScore}</strong><small>{crash.combinedCategory}</small></div>
            </div>
          ) : <p className="muted">Preencha e confirme todos os campos para calcular.</p>}
          <button type="button" disabled={saving || !crash} onClick={saveCrash}>Salvar CRASH adaptada</button>
          <p className="source-note">Base: Extermann et al., Cancer 2012. Substituição por MNA-SF é uma regra local versionada e requer revisão médica.</p>
        </article>
      )}
      {message && <p className="form-message" role="status">{message}</p>}
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  FAMILY_AGA_SCALE_SLOTS,
  FAMILY_AGA_STAGES,
  computeFamilyAgaProgress,
  type FamilyAgaStageId,
  type FamilyAgaScaleId,
} from "@/domain/family-aga-workflow";
import styles from "./page.module.css";

export function FamilyAgaJourney() {
  const [completedStages, setCompletedStages] = useState<FamilyAgaStageId[]>([]);
  const [completedScales, setCompletedScales] = useState<FamilyAgaScaleId[]>([]);
  const progress = useMemo(
    () => computeFamilyAgaProgress(completedStages, completedScales),
    [completedStages, completedScales],
  );

  function toggleStage(id: FamilyAgaStageId) {
    setCompletedStages((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }
  function toggleScale(id: FamilyAgaScaleId) {
    setCompletedScales((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }
  const nextStage = FAMILY_AGA_STAGES.find((stage) =>
    stage.id === "escalas"
      ? progress.scalesCompleted < progress.scalesTotal
      : !completedStages.includes(stage.id),
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <a href="/modulos" className={styles.back}>← Escolher módulo</a>
            <p className={styles.eyebrow}>Medicina de Família · Avaliação Geriátrica Ampla</p>
            <h1>AGA — Médico da Família</h1>
            <p className={styles.subtitle}>Jornada estruturada, acompanhamento do preenchimento e revisão clínica compartilhada.</p>
          </div>
          <span className={styles.prototype}>Protótipo · dados sintéticos</span>
        </header>

        <section className={styles.progressCard} aria-labelledby="aga-progress-title">
          <div className={styles.progressHeader}>
            <div><p className={styles.kicker}>Acompanhamento da jornada</p><h2 id="aga-progress-title">Progresso da avaliação AGA</h2></div>
            <span className={styles.percent}>{progress.percentage}%</span>
          </div>
          <progress className={styles.progress} value={progress.completed} max={progress.total} aria-label="Progresso de preenchimento da avaliação AGA" />
          <div className={styles.progressMeta} aria-live="polite">
            <span><strong>{progress.completed}/{progress.total}</strong> itens registrados na simulação</span>
            <span><strong>{progress.stagesCompleted}/{progress.stagesTotal}</strong> etapas concluídas</span>
            <span><strong>{progress.scalesCompleted}/{progress.scalesTotal}</strong> escalas selecionadas</span>
          </div>
          <p className={styles.progressDisclaimer}>Esta barra mede apenas a simulação de preenchimento. Não representa risco, prognóstico, liberação clínica ou indicação automática de encaminhamento.</p>
        </section>

        <div className={styles.layout}>
          <section className={styles.stages} aria-labelledby="aga-stages-title">
            <div className={styles.sectionHeading}>
              <h2 id="aga-stages-title">Etapas do atendimento</h2>
              <p>Use os controles apenas para visualizar a experiência proposta.</p>
            </div>
            <ol className={styles.stageList}>
              {FAMILY_AGA_STAGES.map((stage, index) => {
                const done = stage.id === "escalas"
                  ? progress.scalesCompleted === progress.scalesTotal
                  : completedStages.includes(stage.id);
                const active = stage.id === nextStage?.id;
                return (
                  <li key={stage.id} className={`${styles.stage} ${done ? styles.done : ""} ${active ? styles.active : ""}`}>
                    <div className={styles.index} aria-hidden="true">{done ? "✓" : index + 1}</div>
                    <div className={styles.stageContent}>
                      <div className={styles.stageTitle}><h3>{stage.title}</h3><span>{done ? "Concluída na simulação" : active ? "Próxima etapa" : "Pendente"}</span></div>
                      <p>{stage.description}</p>
                      {stage.id === "escalas" ? (
                        <fieldset className={styles.scaleSet}>
                          <legend>Instrumentos em definição — controles demonstrativos</legend>
                          {FAMILY_AGA_SCALE_SLOTS.map((scale) => (
                            <label key={scale.id} className={styles.scale}>
                              <input type="checkbox" checked={completedScales.includes(scale.id)} onChange={() => toggleScale(scale.id)} />
                              <span>{scale.title}</span>
                            </label>
                          ))}
                        </fieldset>
                      ) : (
                        <label className={styles.markDone}>
                          <input type="checkbox" checked={done} onChange={() => toggleStage(stage.id)} />
                          Marcar etapa como concluída na simulação
                        </label>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <aside className={styles.aside} aria-label="Informações da jornada">
            <section className={styles.asideCard}>
              <p className={styles.kicker}>Próximo passo</p>
              <h2>{nextStage?.title ?? "Jornada simulada concluída"}</h2>
              <p>{nextStage?.description ?? "Todos os itens visuais foram marcados. Não foi gerada decisão clínica."}</p>
            </section>
            <section className={styles.asideCard}>
              <p className={styles.kicker}>Atenção clínica</p>
              <h2>Achados que exigem avaliação</h2>
              <p>Resultados relevantes deverão ser analisados pelo médico responsável. Uma suspeita de urgência exige conduta assistencial imediata, sem esperar o fluxo de encaminhamento.</p>
              <span className={styles.status}>Classificação automatizada não habilitada</span>
            </section>
            <section className={styles.asideCard}>
              <p className={styles.kicker}>Cuidado compartilhado</p>
              <h2>Médico da família + geriatra</h2>
              <p>A discussão de caso e o encaminhamento serão registrados somente após definirmos protocolo, critérios, consentimento e permissões.</p>
              <button className={styles.disabledAction} type="button" disabled>Encaminhamento indisponível nesta fase</button>
            </section>
            <p className={styles.privacy}>Nenhum dado clínico é digitado, transmitido ou persistido nesta tela. Os marcadores são descartados ao atualizar a página.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}

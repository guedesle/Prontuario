"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { ProfessionalIdentity } from "@/domain/professional-identity";
import styles from "./consultation-workspace.module.css";

type WorkspaceSectionId = "problemas" | "medicamentos" | "soap" | "escalas" | "diretivas" | "relatorio" | "finalizacao";

type WorkspaceSection = {
  id: WorkspaceSectionId;
  label: string;
  shortLabel: string;
  description: string;
};

const SECTIONS: readonly WorkspaceSection[] = [
  { id: "problemas", label: "Problemas", shortLabel: "Problemas", description: "Lista clínica e geriátrica longitudinal" },
  { id: "medicamentos", label: "Medicamentos", shortLabel: "Medicamentos", description: "Reconciliação e horários" },
  { id: "soap", label: "Evolução e plano", shortLabel: "Evolução + plano", description: "SOAP, exames, vacinas e plano por problema" },
  { id: "escalas", label: "Escalas clínicas", shortLabel: "Escalas", description: "Avaliações estruturadas" },
  { id: "diretivas", label: "Diretivas antecipadas", shortLabel: "Diretivas", description: "Valores e preferências revisáveis" },
  { id: "relatorio", label: "Relatório final", shortLabel: "Relatório", description: "Documento para paciente e família" },
  { id: "finalizacao", label: "Finalizar consulta", shortLabel: "Finalizar", description: "Revisão dos itens obrigatórios" },
] as const;

const ProblemWorkspace = dynamic(
  () => import("@/components/problems/problem-workspace").then((module) => module.ProblemWorkspace),
  { ssr: false, loading: () => <WorkspaceLoading /> },
);
const MedicationWorkspace = dynamic(
  () => import("@/components/medications/medication-workspace").then((module) => module.MedicationWorkspace),
  { ssr: false, loading: () => <WorkspaceLoading /> },
);
const SoapEditor = dynamic(
  () => import("@/components/consultations/soap-editor").then((module) => module.SoapEditor),
  { ssr: false, loading: () => <WorkspaceLoading /> },
);
const ClinicalScalesWorkspace = dynamic(
  () => import("@/components/scales/clinical-scales-workspace").then((module) => module.ClinicalScalesWorkspace),
  { ssr: false, loading: () => <WorkspaceLoading /> },
);
const AdvanceDirectivesWorkspace = dynamic(
  () => import("@/components/consultations/advance-directives-workspace").then((module) => module.AdvanceDirectivesWorkspace),
  { ssr: false, loading: () => <WorkspaceLoading /> },
);
const ReportWorkspaceTabs = dynamic(
  () => import("@/components/reports/report-workspace-tabs").then((module) => module.ReportWorkspaceTabs),
  { ssr: false, loading: () => <WorkspaceLoading /> },
);
const ConsultationFinalizationPanel = dynamic(
  () => import("@/components/consultations/consultation-finalization-panel").then((module) => module.ConsultationFinalizationPanel),
  { ssr: false, loading: () => <WorkspaceLoading /> },
);

function WorkspaceLoading() {
  return <div className={styles.loading} role="status">Carregando esta etapa da consulta…</div>;
}

function sectionFromHash(): WorkspaceSectionId | null {
  if (typeof window === "undefined") return null;
  const value = window.location.hash.replace(/^#/, "") as WorkspaceSectionId;
  return SECTIONS.some((section) => section.id === value) ? value : null;
}

export function ConsultationWorkspace({
  consultationId,
  patientName,
  professionalIdentity,
}: {
  consultationId: string;
  patientName: string;
  professionalIdentity: ProfessionalIdentity;
}) {
  const [active, setActive] = useState<WorkspaceSectionId>("soap");
  const [visited, setVisited] = useState<Set<WorkspaceSectionId>>(() => new Set(["soap"]));

  useEffect(() => {
    const initial = sectionFromHash();
    if (initial) {
      setActive(initial);
      setVisited((current) => new Set([...current, initial]));
    }

    function onHashChange() {
      const next = sectionFromHash();
      if (!next) return;
      setActive(next);
      setVisited((current) => new Set([...current, next]));
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.id === active) ?? SECTIONS[0],
    [active],
  );

  function activate(sectionId: WorkspaceSectionId) {
    setActive(sectionId);
    setVisited((current) => new Set([...current, sectionId]));
    window.history.replaceState(null, "", `#${sectionId}`);
  }

  return (
    <section className={styles.workspace} aria-labelledby="consultation-workspace-title">
      <aside className={styles.navigation} aria-label="Navegação da consulta">
        <div className={styles.navigationHeading}>
          <span className={styles.eyebrow}>Consulta em etapas</span>
          <strong id="consultation-workspace-title">{patientName}</strong>
        </div>
        <div className={styles.sectionList} role="list" aria-label="Áreas do prontuário">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={active === section.id ? styles.active : ""}
              aria-current={active === section.id ? "step" : undefined}
              onClick={() => activate(section.id)}
            >
              <span className={styles.sectionLabel}>{section.label}</span>
              <span className={styles.sectionShortLabel}>{section.shortLabel}</span>
              <small>{section.description}</small>
            </button>
          ))}
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.contentHeader}>
          <span className={styles.eyebrow}>Etapa atual</span>
          <h2>{activeSection.label}</h2>
          <p>{activeSection.description}</p>
        </header>

        {visited.has("problemas") ? (
          <div id="problemas" hidden={active !== "problemas"}>
            <ProblemWorkspace consultationId={consultationId} />
          </div>
        ) : null}
        {visited.has("medicamentos") ? (
          <div id="medicamentos" hidden={active !== "medicamentos"}>
            <MedicationWorkspace consultationId={consultationId} />
          </div>
        ) : null}
        <div id="soap" hidden={active !== "soap"}>
          <SoapEditor consultationId={consultationId} />
        </div>
        {visited.has("escalas") ? (
          <div id="escalas" hidden={active !== "escalas"}>
            <ClinicalScalesWorkspace consultationId={consultationId} />
          </div>
        ) : null}
        {visited.has("diretivas") ? (
          <div id="diretivas" hidden={active !== "diretivas"}>
            <AdvanceDirectivesWorkspace consultationId={consultationId} />
          </div>
        ) : null}
        {visited.has("relatorio") ? (
          <div id="relatorio" hidden={active !== "relatorio"}>
            <ReportWorkspaceTabs consultationId={consultationId} professionalIdentity={professionalIdentity} />
          </div>
        ) : null}
        {visited.has("finalizacao") ? (
          <div id="finalizacao" hidden={active !== "finalizacao"}>
            <ConsultationFinalizationPanel consultationId={consultationId} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

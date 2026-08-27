"use client";

import { useState } from "react";
import { AgaReportDocumentPreview } from "./aga-report-document-preview";
import { GeriatricConductWorkspace } from "./geriatric-conduct-workspace";
import styles from "./report-workspace-tabs.module.css";

type Tab = "family" | "conduct";

export function ReportWorkspaceTabs({ consultationId }: { consultationId: string }) {
  const [tab, setTab] = useState<Tab>("family");

  return <section className={styles.shell} aria-label="Relatórios e condutas da consulta">
    <div className={`${styles.tabs} no-print`} role="tablist" aria-label="Área de relatório">
      <button type="button" role="tab" aria-selected={tab === "family"} className={tab === "family" ? styles.active : ""} onClick={() => setTab("family")}>Relatório paciente/família</button>
      <button type="button" role="tab" aria-selected={tab === "conduct"} className={tab === "conduct" ? styles.active : ""} onClick={() => setTab("conduct")}>Condutas da consulta geriátrica</button>
    </div>
    <div role="tabpanel">
      {tab === "family"
        ? <AgaReportDocumentPreview consultationId={consultationId} />
        : <GeriatricConductWorkspace consultationId={consultationId} />}
    </div>
  </section>;
}

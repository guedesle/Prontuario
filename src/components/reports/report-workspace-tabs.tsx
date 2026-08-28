"use client";

import { useRef, useState } from "react";
import { AgaReportDocumentPreview } from "./aga-report-document-preview";
import { GeriatricConductWorkspace } from "./geriatric-conduct-workspace";
import styles from "./report-workspace-tabs.module.css";

type Tab = "family" | "conduct";

const TAB_ORDER: readonly Tab[] = ["family", "conduct"];

export function ReportWorkspaceTabs({ consultationId }: { consultationId: string }) {
  const [tab, setTab] = useState<Tab>("family");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ family: null, conduct: null });

  function selectWithKeyboard(current: Tab, direction: 1 | -1) {
    const currentIndex = TAB_ORDER.indexOf(current);
    const nextIndex = (currentIndex + direction + TAB_ORDER.length) % TAB_ORDER.length;
    const next = TAB_ORDER[nextIndex]!;
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  return <section className={styles.shell} aria-label="Relatórios e condutas da consulta">
    <div className={`${styles.tabs} no-print`} role="tablist" aria-label="Área de relatório">
      <button
        ref={(element) => { tabRefs.current.family = element; }}
        id="family-report-tab"
        type="button"
        role="tab"
        aria-selected={tab === "family"}
        aria-controls="family-report-panel"
        tabIndex={tab === "family" ? 0 : -1}
        className={tab === "family" ? styles.active : ""}
        onClick={() => setTab("family")}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") { event.preventDefault(); selectWithKeyboard("family", 1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); selectWithKeyboard("family", -1); }
        }}
      >
        Relatório para paciente e família
      </button>
      <button
        ref={(element) => { tabRefs.current.conduct = element; }}
        id="geriatric-conduct-tab"
        type="button"
        role="tab"
        aria-selected={tab === "conduct"}
        aria-controls="geriatric-conduct-panel"
        tabIndex={tab === "conduct" ? 0 : -1}
        className={tab === "conduct" ? styles.active : ""}
        onClick={() => setTab("conduct")}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") { event.preventDefault(); selectWithKeyboard("conduct", 1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); selectWithKeyboard("conduct", -1); }
        }}
      >
        Condutas da consulta geriátrica
      </button>
    </div>
    <div
      id={tab === "family" ? "family-report-panel" : "geriatric-conduct-panel"}
      role="tabpanel"
      aria-labelledby={tab === "family" ? "family-report-tab" : "geriatric-conduct-tab"}
    >
      {tab === "family"
        ? <AgaReportDocumentPreview consultationId={consultationId} />
        : <GeriatricConductWorkspace consultationId={consultationId} />}
    </div>
  </section>;
}

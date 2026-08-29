"use client";

import { AgaReportDocumentPreview } from "./aga-report-document-preview";
import styles from "./report-workspace-tabs.module.css";

export function ReportWorkspaceTabs({ consultationId }: { consultationId: string }) {
  return (
    <section className={styles.shell} aria-label="Relatório final da consulta">
      <AgaReportDocumentPreview consultationId={consultationId} />
    </section>
  );
}

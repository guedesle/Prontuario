"use client";

import { useState } from "react";

export function OncogeriatricReportActions() {
  const [message, setMessage] = useState<string | null>(null);
  async function copy() {
    const report = document.getElementById("oncogeriatric-report");
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.innerText);
      setMessage("Resumo copiado.");
    } catch {
      setMessage("Não foi possível copiar automaticamente.");
    }
  }
  return <div className="report-actions no-print"><button type="button" onClick={() => window.print()}>Imprimir</button><button type="button" onClick={copy}>Copiar</button>{message ? <span role="status">{message}</span> : null}</div>;
}

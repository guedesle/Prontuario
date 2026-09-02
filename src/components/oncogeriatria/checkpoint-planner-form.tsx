"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const types = [
  ["PERIODIC_REASSESSMENT", "Reavaliação ampliada"],
  ["EVENT_DRIVEN", "Reavaliação por evento"],
  ["END_OF_TREATMENT", "Final do tratamento"],
  ["POST_3_MONTHS", "Seguimento 3 meses"],
  ["POST_6_MONTHS", "Seguimento 6 meses"],
  ["POST_12_MONTHS", "Seguimento 12 meses"],
] as const;

export function CheckpointPlannerForm({ patientId, episodeId }: { patientId: string; episodeId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true); setMessage(null);
    try {
      const response = await fetch(`/api/oncogeriatria/patients/${patientId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHECKPOINT_CREATE", episodeId, type: String(data.get("type") ?? ""), occurredAt: String(data.get("occurredAt") ?? ""), scheduledAt: String(data.get("scheduledAt") ?? "") || null, structuredData: { trigger: String(data.get("trigger") ?? "").trim() || null } }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Não foi possível registrar checkpoint.");
      setMessage("Checkpoint registrado. Nenhuma consulta foi criada automaticamente.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível registrar checkpoint."); }
    finally { setPending(false); }
  }
  return <form className="patient-form" onSubmit={submit}><label>Tipo<select name="type">{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Data de referência<input type="date" name="occurredAt" required /></label><label>Próximo checkpoint previsto (opcional)<input type="date" name="scheduledAt" /></label><label>Gatilho/observação<input name="trigger" placeholder="Ex.: pós-hospitalização, nova perda funcional" /></label><button type="submit" disabled={pending}>{pending ? "Salvando…" : "Registrar checkpoint"}</button>{message ? <p role="status" className="muted">{message}</p> : null}</form>;
}

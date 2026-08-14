"use client";

import { useState } from "react";

export function PatientForm() {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [duplicate, setDuplicate] = useState<{ existingPatientId: string; reason: string } | null>(null);
  const [message, setMessage] = useState("");

  async function submit(event: { preventDefault(): void }, confirmTrueHomonym = false) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/patients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName,
        birthDate: birthDate || null,
        identifiers: cpf ? [{ type: "CPF", value: cpf }] : [],
        confirmTrueHomonym,
      }),
    });
    const result = await response.json();
    if (response.status === 409) {
      setDuplicate(result);
      return;
    }
    if (!response.ok) {
      setMessage(result.message ?? "Não foi possível cadastrar o paciente.");
      return;
    }
    window.location.assign(`/patients/${result.patientId}`);
  }

  return (
    <form className="patient-form" onSubmit={submit}>
      <label>Nome completo<input required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
      <label>Data de nascimento<input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
      <label>CPF, quando disponível<input inputMode="numeric" value={cpf} onChange={(event) => setCpf(event.target.value)} /></label>
      <button type="submit">Verificar e cadastrar</button>
      {duplicate ? (
        <aside className="duplicate-warning" role="alert">
          <p>Há um cadastro possivelmente correspondente ({duplicate.reason}).</p>
          <a href={`/patients/${duplicate.existingPatientId}`}>Abrir cadastro existente</a>
          {duplicate.reason !== "strong-identifier" ? (
            <button type="button" onClick={(event) => void submit(event, true)}>Confirmar que é homônimo verdadeiro</button>
          ) : null}
        </aside>
      ) : null}
      {message ? <p role="alert">{message}</p> : null}
    </form>
  );
}

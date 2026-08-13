"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (result.error) {
      setError("Não foi possível autenticar. Confirme se este e-mail está autorizado.");
      setPending(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="login-title">
        <p className="eyebrow">Acesso restrito</p>
        <h1 id="login-title">Prontuário Aprimorado</h1>
        <p>Entre somente com uma conta Google previamente autorizada pela administração.</p>
        <button type="button" onClick={signInWithGoogle} disabled={pending}>
          {pending ? "Conectando…" : "Entrar com Google"}
        </button>
        {error ? <p role="alert">{error}</p> : null}
      </section>
    </main>
  );
}

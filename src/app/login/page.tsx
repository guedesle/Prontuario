"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setPending(true);
    setError(null);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/login?error=google",
      });

      if (result.error) {
        setError("Não foi possível autenticar com o Google. Tente novamente.");
        setPending(false);
      }
    } catch {
      setError("Não foi possível autenticar com o Google. Tente novamente.");
      setPending(false);
    }
  }

  return (
    <main
      className="shell"
      style={{
        width: "min(760px, calc(100% - 32px))",
        margin: "0 auto",
        padding: "56px 0 80px",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#2e2f30",
      }}
    >
      <section
        className="hero"
        aria-labelledby="login-title"
        style={{
          background: "#ffffff",
          border: "1px solid #e2d9da",
          borderRadius: 18,
          padding: 40,
        }}
      >
        <p
          className="eyebrow"
          style={{
            margin: "0 0 8px",
            color: "#896d72",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          Acesso restrito
        </p>
        <h1
          id="login-title"
          style={{
            margin: 0,
            color: "#896d72",
            fontSize: "clamp(34px, 5vw, 56px)",
            letterSpacing: "-.03em",
          }}
        >
          Prontuário Aprimorado
        </h1>
        <p style={{ maxWidth: 620, margin: "16px 0 24px", color: "#6e6264", fontSize: 18, lineHeight: 1.6 }}>
          Entre somente com uma conta Google previamente autorizada pela administração.
        </p>
        <button type="button" onClick={signInWithGoogle} disabled={pending}>
          {pending ? "Conectando…" : "Entrar com Google"}
        </button>
        {error ? (
          <p role="alert" style={{ marginTop: 18, color: "#8f2727", fontWeight: 700 }}>
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}

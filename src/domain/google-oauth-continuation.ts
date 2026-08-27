function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function validateGoogleOAuthTarget(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "accounts.google.com") {
    throw new Error("Destino OAuth Google inválido.");
  }
  if (!url.searchParams.get("state")) {
    throw new Error("Destino OAuth Google sem state.");
  }
  return url;
}

export function renderGoogleOAuthContinuationPage(target: URL): string {
  const href = escapeHtmlAttribute(target.toString());
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Continuar com Google</title>
</head>
<body style="margin:0;background:#f7f5f6;font-family:Arial,Helvetica,sans-serif;color:#2e2f30;">
  <main style="width:min(620px,calc(100% - 32px));margin:0 auto;padding:56px 0 80px;">
    <section style="background:#fff;border:1px solid #e2d9da;border-radius:18px;padding:32px;">
      <p style="margin:0 0 8px;color:#896d72;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Acesso seguro</p>
      <h1 style="margin:0;color:#896d72;font-size:32px;">Continuar com Google</h1>
      <p style="margin:16px 0 22px;color:#6e6264;font-size:17px;line-height:1.55;">Por segurança, a autenticação do Google precisa ser aberta por uma ação sua. Toque no botão abaixo para continuar.</p>
      <a data-google-oauth-continuation="true" data-google-oauth-user-gesture="true" href="${href}" target="_top" style="display:inline-block;padding:11px 17px;border-radius:8px;background:#5d237a;color:#fff;font-weight:700;text-decoration:none;">Continuar com Google</a>
      <p style="margin:20px 0 8px;color:#756a6c;font-size:14px;line-height:1.5;">Se esta página estiver aberta dentro de outro aplicativo e o Google não abrir, use o botão abaixo para iniciar um novo contexto do prontuário. Depois toque novamente em “Continuar com Google”.</p>
      <a data-google-oauth-browser-restart="true" href="/auth/google?fresh=1" target="_blank" rel="noopener" style="display:inline-block;padding:10px 15px;border-radius:8px;border:1px solid #896d72;color:#5d237a;font-weight:700;text-decoration:none;">Abrir o prontuário em nova janela</a>
      <p style="margin:18px 0 0;color:#756a6c;font-size:13px;line-height:1.5;">O prontuário não inicia mais redirecionamentos automáticos para o Google.</p>
    </section>
  </main>
</body>
</html>`;
}

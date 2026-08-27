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
  <meta http-equiv="refresh" content="1;url=${href}" />
  <title>Continuar com Google</title>
</head>
<body style="margin:0;background:#f7f5f6;font-family:Arial,Helvetica,sans-serif;color:#2e2f30;">
  <main style="width:min(620px,calc(100% - 32px));margin:0 auto;padding:56px 0 80px;">
    <section style="background:#fff;border:1px solid #e2d9da;border-radius:18px;padding:32px;">
      <p style="margin:0 0 8px;color:#896d72;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Acesso seguro</p>
      <h1 style="margin:0;color:#896d72;font-size:32px;">Continuar com Google</h1>
      <p style="margin:16px 0 22px;color:#6e6264;font-size:17px;line-height:1.55;">Estamos abrindo a autenticação do Google. Se ela não abrir automaticamente, toque no botão abaixo.</p>
      <a data-google-oauth-continuation="true" href="${href}" style="display:inline-block;padding:11px 17px;border-radius:8px;background:#5d237a;color:#fff;font-weight:700;text-decoration:none;">Continuar no Google</a>
      <p style="margin:18px 0 0;color:#756a6c;font-size:14px;line-height:1.5;">Se estiver usando um navegador interno de outro aplicativo, abra este prontuário diretamente no Safari ou Chrome.</p>
    </section>
  </main>
</body>
</html>`;
}

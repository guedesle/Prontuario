export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function textToSafeHtml(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

export function safeListHtml(items: readonly string[]): string {
  const safe = items.length ? items : ["sem dados registrados"];
  return `<ul>${safe.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

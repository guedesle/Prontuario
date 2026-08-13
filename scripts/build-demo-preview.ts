import { writeFileSync } from "node:fs";
import { buildConsultationOutputs } from "../src/domain/consultation-output.ts";
import { DEMO_ASSESSMENTS, DEMO_MEDICATIONS, DEMO_PATIENT, DEMO_PROBLEMS } from "../src/domain/demo-case.ts";

const outputs = buildConsultationOutputs({
  patientId: DEMO_PATIENT.id,
  consultationId: "demo-follow-2",
  patientName: DEMO_PATIENT.name,
  longitudinalAssessments: DEMO_ASSESSMENTS,
  longitudinalProblems: DEMO_PROBLEMS,
  subjective: "Caso inteiramente sintético.",
  medicationPlan: DEMO_MEDICATIONS,
  contactPhone: "71 99992-1416",
});

const summary = outputs.followUpContext.changeSummary;
const escape = (value: unknown) => String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]!));

const cards = summary.cards.map((card) => `
  <article class="card">
    <div><small>${escape(card.dimension)}</small><h3>${escape(card.name)}</h3><p>${escape(card.trendLabel)}</p></div>
    <div class="score"><span>Anterior</span><b>${escape(card.vsPrevious.fromScore ?? "—")}</b></div>
    <div class="arrow">→</div>
    <div class="score current"><span>Atual</span><b>${escape(card.vsPrevious.toScore ?? card.current.score ?? "—")}</b></div>
    <div class="score"><span>Baseline</span><b>${escape(card.baseline.score ?? "—")}</b></div>
  </article>`).join("");

const proposals = outputs.followUpContext.proposedProblems.map((problem) => `<li><b>${escape(problem.title)}</b><span>${escape(problem.evidence.join(" · "))}</span></li>`).join("");
const plan = summary.combinedPlan.agora.slice(0, 8).map((item) => `<li>${escape(item)}</li>`).join("");

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prontuário Aprimorado — Demonstração</title>
<style>
:root{--p:#896d72;--soft:#f0ebec;--ink:#2e2f30;--muted:#6e6264;--line:#e2d9da;--bg:#f7f4f4}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Arial,sans-serif}.shell{width:min(1080px,calc(100% - 32px));margin:auto;padding:40px 0 70px}.hero,.panel,.card,.metric{background:white;border:1px solid var(--line);border-radius:16px}.hero{padding:34px}h1{margin:0;color:var(--p);font-size:48px}.hero p{color:var(--muted);font-size:18px}.eyebrow,small{color:var(--p);font-weight:700;text-transform:uppercase;letter-spacing:.07em}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0 32px}.metric{padding:16px;display:grid;gap:4px}.metric b{font-size:28px;color:var(--p)}.metric span{color:var(--muted);font-size:13px}.list{display:grid;gap:10px}.card{padding:16px 18px;display:grid;grid-template-columns:1fr 80px 24px 80px 80px;align-items:center;gap:10px}.card h3{margin:3px 0}.card p{margin:0;color:var(--muted);font-size:13px}.score{display:grid;text-align:center;gap:3px}.score span{font-size:10px;text-transform:uppercase;color:var(--muted)}.score b{font-size:20px}.current{background:var(--soft);padding:10px;border-radius:10px}.arrow{text-align:center}.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:26px}.panel{padding:22px}.panel h2{margin-top:6px}.panel ul{padding-left:20px}.panel li{margin-bottom:10px;line-height:1.45}.panel li span{display:block;color:var(--muted);font-size:12px;margin-top:3px}.docs pre{white-space:pre-wrap;font:11px/1.5 ui-monospace,monospace}.warning{border-left:4px solid var(--p);padding:14px 18px;background:var(--soft);margin:18px 0;border-radius:8px}@media(max-width:760px){.metrics{grid-template-columns:1fr 1fr}.card{grid-template-columns:1fr 60px 18px 60px}.card .score:last-child{display:none}.cols{grid-template-columns:1fr}h1{font-size:36px}}
</style></head><body><main class="shell">
<header class="hero"><p class="eyebrow">Caso sintético — nenhum dado real</p><h1>O que mudou?</h1><p>${escape(summary.headline)}</p></header>
<div class="warning"><b>Apoio à decisão:</b> tendências numéricas e propostas precisam de revisão médica antes de integrar o prontuário.</div>
<section class="metrics">
<div class="metric"><b>${summary.counts.unfavorable}</b><span>desfavoráveis</span></div><div class="metric"><b>${summary.counts.favorable}</b><span>favoráveis</span></div><div class="metric"><b>${summary.counts.stable}</b><span>estáveis</span></div><div class="metric"><b>${summary.counts.urgentAlerts}</b><span>alertas urgentes</span></div>
</section>
<section><p class="eyebrow">Evolução longitudinal</p><h2>Escalas prioritárias</h2><div class="list">${cards}</div></section>
<section class="cols"><article class="panel"><p class="eyebrow">Revisão médica</p><h2>Problemas sugeridos</h2><ul>${proposals}</ul></article><article class="panel"><p class="eyebrow">Plano integrado</p><h2>Intervenções sugeridas</h2><ul>${plan}</ul></article></section>
<section class="cols docs"><article class="panel"><p class="eyebrow">Prévia SOAP</p><pre>${escape(outputs.soapText)}</pre></article><article class="panel"><p class="eyebrow">Prévia família</p><pre>${escape(outputs.familyReportText)}</pre></article></section>
</main></body></html>`;

writeFileSync("artifacts/demo-preview.html", html, "utf8");
console.log(`Preview gerado: ${summary.cards.length} escalas, ${outputs.followUpContext.proposedProblems.length} propostas, ${summary.counts.urgentAlerts} alertas urgentes.`);

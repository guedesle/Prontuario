import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("consulta expõe barra lateral com todas as etapas principais e âncoras correspondentes", () => {
  const pageSource = readFileSync(
    new URL("../../src/app/consultations/[id]/page.tsx", import.meta.url),
    "utf8",
  );
  const pageStyles = readFileSync(
    new URL("../../src/app/consultations/[id]/page.module.css", import.meta.url),
    "utf8",
  );
  const navSource = readFileSync(
    new URL("../../src/components/consultations/consultation-section-nav.tsx", import.meta.url),
    "utf8",
  );
  const navStyles = readFileSync(
    new URL("../../src/components/consultations/consultation-section-nav.module.css", import.meta.url),
    "utf8",
  );

  for (const id of [
    "resumo-consulta",
    "problemas",
    "medicamentos",
    "soap",
    "escalas",
    "relatorio",
    "finalizacao",
  ]) {
    assert.equal(pageSource.includes(`id="${id}"`), true);
    assert.equal(navSource.includes(`id: "${id}"`), true);
  }

  assert.match(pageSource, /ConsultationSectionNav/);
  assert.match(navSource, /IntersectionObserver/);
  assert.match(navSource, /aria-current/);
  assert.match(navSource, /aria-label="Seções do preenchimento da consulta"/);

  // Desktop: a coluna inteira acompanha a página, sem ficar limitada pela altura
  // intrínseca do próprio <nav>. Isso protege o comportamento sticky real.
  assert.match(pageStyles, /\.sidebarColumn\s*\{[\s\S]*position:\s*sticky/);
  assert.match(pageStyles, /\.sidebarColumn\s*\{[\s\S]*top:\s*20px/);
  assert.match(pageStyles, /max-height:\s*calc\(100vh - 40px\)/);
  assert.match(pageStyles, /overflow-y:\s*auto/);

  // Tablet/mobile: a barra deixa de ser sticky e vira faixa horizontal navegável.
  assert.match(pageStyles, /@media \(max-width:\s*980px\)[\s\S]*\.sidebarColumn[\s\S]*position:\s*relative/);
  assert.match(navStyles, /overflow-x:\s*auto/);
  assert.match(navStyles, /scroll-snap-type:\s*x proximity/);
  assert.match(navStyles, /\.active/);
});

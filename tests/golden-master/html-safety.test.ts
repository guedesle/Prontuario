import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, safeListHtml, textToSafeHtml } from "../../src/domain/html-safety.ts";

test("escape HTML neutraliza tags, atributos e entidades", () => {
  const input = `<img src=x onerror="alert('x')"> & teste`;
  const output = escapeHtml(input);
  assert.equal(output.includes("<img"), false);
  assert.equal(output.includes("onerror=\""), false);
  assert.ok(output.includes("&lt;img"));
  assert.ok(output.includes("&amp; teste"));
});

test("texto multilinha só introduz br controlado", () => {
  const output = textToSafeHtml("linha 1\n<script>alert(1)</script>");
  assert.ok(output.includes("<br>"));
  assert.equal(output.includes("<script>"), false);
});

test("lista HTML escapa cada item", () => {
  const output = safeListHtml(["Normal", "<b>não confiar</b>"]);
  assert.ok(output.startsWith("<ul>"));
  assert.equal(output.includes("<b>"), false);
});

import assert from "node:assert/strict";
import test from "node:test";
import { proportionalAxisPosition } from "../../src/domain/chart-geometry.ts";

test("eixo temporal preserva proporção de intervalos irregulares", () => {
  const january = Date.parse("2026-01-01T00:00:00Z");
  const february = Date.parse("2026-02-01T00:00:00Z");
  const december = Date.parse("2026-12-01T00:00:00Z");
  const start = 18;
  const end = 502;
  const first = proportionalAxisPosition({ value: january, min: january, max: december, start, end });
  const second = proportionalAxisPosition({ value: february, min: january, max: december, start, end });
  const last = proportionalAxisPosition({ value: december, min: january, max: december, start, end });

  assert.equal(first, start);
  assert.equal(last, end);
  assert.ok(second - first < (last - first) / 5, "um mês não pode ocupar o mesmo espaço visual que dez meses");
});

test("eixo constante usa o centro e rejeita limites inválidos", () => {
  assert.equal(proportionalAxisPosition({ value: 10, min: 10, max: 10, start: 0, end: 100 }), 50);
  assert.throws(() => proportionalAxisPosition({ value: 1, min: 2, max: 1, start: 0, end: 100 }), /invertidos/);
  assert.throws(() => proportionalAxisPosition({ value: Number.NaN, min: 0, max: 1, start: 0, end: 100 }), /finitos/);
});

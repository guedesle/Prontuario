/** Projeta um valor real em um eixo linear sem substituir ausências por zero. */
export function proportionalAxisPosition(input: {
  value: number;
  min: number;
  max: number;
  start: number;
  end: number;
}): number {
  const values = [input.value, input.min, input.max, input.start, input.end];
  if (values.some((value) => !Number.isFinite(value))) throw new Error("Geometria do gráfico exige valores finitos.");
  if (input.max < input.min) throw new Error("Limites do eixo do gráfico estão invertidos.");
  if (input.max === input.min) return input.start + (input.end - input.start) / 2;
  return input.start + ((input.value - input.min) / (input.max - input.min)) * (input.end - input.start);
}

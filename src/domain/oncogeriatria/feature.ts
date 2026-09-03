export const ONCOGERIATRIA_VERSION = "oncogeriatria-longitudinal-v1" as const;

export function isOncogeriatriaEnabled(emergencyDisabled: string | undefined): boolean {
  return emergencyDisabled?.trim().toLowerCase() !== "true";
}

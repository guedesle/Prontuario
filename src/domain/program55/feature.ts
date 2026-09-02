export function isProgram55Enabled(emergencyDisabled: string | undefined): boolean {
  return emergencyDisabled?.trim().toLowerCase() !== "true";
}

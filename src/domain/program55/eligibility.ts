export const PROGRAM55_MIN_AGE = 55 as const;
export const PROGRAM55_MAX_AGE = 70 as const;

export function ageOnDate(birthDate: Date, referenceDate: Date): number {
  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const referenceMonth = referenceDate.getUTCMonth();
  const birthMonth = birthDate.getUTCMonth();
  const birthdayHasOccurred =
    referenceMonth > birthMonth ||
    (referenceMonth === birthMonth && referenceDate.getUTCDate() >= birthDate.getUTCDate());

  if (!birthdayHasOccurred) age -= 1;
  return age;
}

export function isProgram55Eligible(
  birthDate: Date | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  if (!birthDate) return false;
  const age = ageOnDate(birthDate, referenceDate);
  return age >= PROGRAM55_MIN_AGE && age <= PROGRAM55_MAX_AGE;
}

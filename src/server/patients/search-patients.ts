import {
  assertPatientSearchQuery,
  PATIENT_SEARCH_LIMIT,
  toPatientSelectionResult,
  type PatientSelectionResult,
} from "../../domain/patient-search.ts";
import { requireAuthenticatedUser } from "../auth/require-user";
import { prisma } from "../db";

export async function searchPatientsForSelection(
  query: string,
): Promise<PatientSelectionResult[]> {
  await requireAuthenticatedUser("patient.read");
  const normalizedQuery = assertPatientSearchQuery(query);

  const patients = await prisma.patient.findMany({
    where: {
      normalizedFullName: {
        contains: normalizedQuery,
      },
    },
    orderBy: [
      { normalizedFullName: "asc" },
      { birthDate: "asc" },
      { id: "asc" },
    ],
    take: PATIENT_SEARCH_LIMIT,
    select: {
      id: true,
      fullName: true,
      birthDate: true,
      needsIdentityReview: true,
    },
  });

  return patients.map(toPatientSelectionResult);
}

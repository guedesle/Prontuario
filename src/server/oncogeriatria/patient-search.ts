import type { PrismaClient } from "../../generated/prisma/client.ts";
import { searchPatientsInDatabase } from "../patients/search-patients-database.ts";

type OncogeriatricPatientSearchClient = Pick<PrismaClient, "patient">;

export interface OncogeriatricPatientSearchResult {
  id: string;
  fullName: string;
  birthDate: string | null;
}

/**
 * Reutiliza a busca canônica do prontuário para a porta de entrada da Oncogeriatria.
 * Isso preserva normalização, busca por termos e os fallbacks já consolidados para
 * dados legados/schema divergente, evitando uma segunda implementação suscetível a 500.
 */
export async function searchOncogeriatricPatientCandidates(
  client: OncogeriatricPatientSearchClient,
  query: string,
): Promise<OncogeriatricPatientSearchResult[]> {
  const results = await searchPatientsInDatabase(client, query);
  return results.map((patient) => ({
    id: patient.id,
    fullName: patient.fullName,
    birthDate: patient.birthDate,
  }));
}

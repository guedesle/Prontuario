import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { FamilyAgaJourney } from "./aga-journey";

export const dynamic = "force-dynamic";

export default async function FamilyAgaPage() {
  await requireAuthenticatedUser("patient.read");
  return <FamilyAgaJourney />;
}

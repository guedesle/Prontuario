import { NextResponse } from "next/server";
import { PatientSearchValidationError } from "@/domain/patient-search";
import { AccessForbiddenError, AuthenticationRequiredError } from "@/server/auth/access-errors";
import { searchPatientsForSelection } from "@/server/patients/search-patients";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { query?: unknown };
    const query = typeof body.query === "string" ? body.query : "";
    const results = await searchPatientsForSelection(query);
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json(
        { code: "AUTHENTICATION_REQUIRED", message: error.message },
        { status: 401 },
      );
    }
    if (error instanceof AccessForbiddenError) {
      return NextResponse.json(
        { code: "ACCESS_FORBIDDEN", message: error.message },
        { status: 403 },
      );
    }
    if (error instanceof PatientSearchValidationError) {
      return NextResponse.json(
        { code: "INVALID_PATIENT_SEARCH", message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "PATIENT_SEARCH_FAILED", message: "Não foi possível localizar pacientes." },
      { status: 500 },
    );
  }
}

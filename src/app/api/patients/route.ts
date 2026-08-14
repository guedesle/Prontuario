import { NextResponse } from "next/server";
import { createPatientSafely, type CreatePatientInput } from "@/server/patients/create-patient";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<CreatePatientInput, "birthDate"> & {
      birthDate?: string | null;
    };
    const result = await createPatientSafely({
      ...body,
      birthDate: body.birthDate ? new Date(`${body.birthDate}T12:00:00.000Z`) : null,
    });

    if (!result.created) {
      return NextResponse.json(
        {
          code: "DUPLICATE_PATIENT",
          existingPatientId: result.existingPatientId,
          reason: result.reason,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        code: "PATIENT_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Não foi possível cadastrar o paciente.",
      },
      { status: 400 },
    );
  }
}

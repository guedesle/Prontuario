import { NextResponse } from "next/server";
import {
  createOncogeriatricCheckpoint,
  createOncogeriatricEpisode,
  createOncogeriatricIntervention,
  createOncogeriatricRecoveryAssessment,
  createOncogeriatricReportSnapshot,
  createOncogeriatricToxicityEvent,
  createOncogeriatricTreatmentCourse,
  OncogeriatricError,
  saveG8,
  saveOncogeriatricCheckpointData,
} from "@/server/oncogeriatria/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: patientId } = await params;
    const body = await request.json() as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "EPISODE_CREATE") return NextResponse.json(await createOncogeriatricEpisode(patientId, body), { status: 201 });
    if (action === "TREATMENT_COURSE_CREATE") return NextResponse.json(await createOncogeriatricTreatmentCourse(patientId, body), { status: 201 });
    if (action === "CHECKPOINT_CREATE") return NextResponse.json(await createOncogeriatricCheckpoint(patientId, body), { status: 201 });
    if (action === "CHECKPOINT_UPDATE") return NextResponse.json(await saveOncogeriatricCheckpointData(patientId, body), { status: 200 });
    if (action === "G8_SAVE") return NextResponse.json(await saveG8(patientId, body), { status: 200 });
    if (action === "CARG_SAVE") {
      return NextResponse.json(
        {
          code: "CARG_LICENSE_REVIEW_REQUIRED",
          message: "A implementação eletrônica local do CARG permanece bloqueada até autorização formal de copyright/licenciamento. Nenhum dado clínico é enviado a serviço externo.",
        },
        { status: 409 },
      );
    }
    if (action === "INTERVENTION_CREATE") return NextResponse.json(await createOncogeriatricIntervention(patientId, body), { status: 201 });
    if (action === "TOXICITY_CREATE") return NextResponse.json(await createOncogeriatricToxicityEvent(patientId, body), { status: 201 });
    if (action === "RECOVERY_CREATE") return NextResponse.json(await createOncogeriatricRecoveryAssessment(patientId, body), { status: 201 });
    if (action === "REPORT_SNAPSHOT") return NextResponse.json(await createOncogeriatricReportSnapshot(patientId, body), { status: 201 });

    return NextResponse.json({ code: "UNKNOWN_ONCOGERIATRIA_ACTION", message: "Ação inválida." }, { status: 400 });
  } catch (error) {
    if (error instanceof OncogeriatricError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: error.httpStatus });
    }
    console.error("ONCOGERIATRIA_API_ERROR", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { code: "ONCOGERIATRIA_REQUEST_FAILED", message: "Não foi possível salvar a linha oncogeriátrica." },
      { status: 500 },
    );
  }
}

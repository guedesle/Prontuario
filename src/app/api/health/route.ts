import { NextResponse } from "next/server";
import { CLINICAL_RELEASE_ID } from "@/domain/clinical-release";
import { prisma } from "@/server/db";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", database: "ok", releaseId: CLINICAL_RELEASE_ID },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "unavailable", releaseId: CLINICAL_RELEASE_ID },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}

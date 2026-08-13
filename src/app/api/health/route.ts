import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unavailable" }, { status: 503 });
  }
}

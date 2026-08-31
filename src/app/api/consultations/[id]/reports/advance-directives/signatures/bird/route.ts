import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { prisma } from "@/server/db";
import { beginAdvanceDirectivesBirdSignature } from "@/server/signatures/bird-signature-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: consultationId } = await context.params;
    const { user } = await requireAuthenticatedUser("document.generate");
    const body = await request.json().catch(() => ({})) as { snapshotId?: unknown };
    const requestedSnapshotId = typeof body.snapshotId === "string" && body.snapshotId ? body.snapshotId : null;
    const latestSnapshot = requestedSnapshotId ? null : await prisma.documentSnapshot.findFirst({
      where: { consultationId, type: "AGA_REPORT", generatedById: user.id },
      orderBy: [{ createdAt: "desc" }, { version: "desc" }],
      select: { id: true },
    });
    const snapshotId = requestedSnapshotId ?? latestSnapshot?.id;
    if (!snapshotId) {
      return NextResponse.json({
        code: "SNAPSHOT_REQUIRED",
        message: "Gere a prévia do relatório, revise a aba de diretivas antecipadas e então inicie a assinatura.",
      }, { status: 400 });
    }

    const result = await beginAdvanceDirectivesBirdSignature({ consultationId, snapshotId, user });
    const response = NextResponse.json({
      signatureId: result.signatureId,
      authorizationUrl: result.authorizationUrl,
      expiresAt: result.expiresAt.toISOString(),
    }, { status: 201 });
    response.cookies.set("bird_pkce", `${result.signatureId}.${result.pkceVerifier}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: (process.env.APP_URL ?? "").startsWith("https://"),
      path: "/api/signatures/bird",
      expires: result.expiresAt,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "BIRD_SIGNATURE_START_FAILED";
    const notConfigured = message.startsWith("BIRD_NOT_CONFIGURED") || message.startsWith("BIRD_CONFIGURATION_INVALID");
    const directivesUnavailable = message === "ADVANCE_DIRECTIVES_NOT_AVAILABLE";
    return NextResponse.json({
      code: notConfigured
        ? "BIRD_NOT_CONFIGURED"
        : directivesUnavailable
          ? "ADVANCE_DIRECTIVES_NOT_AVAILABLE"
          : "BIRD_SIGNATURE_START_FAILED",
      message: notConfigured
        ? "A assinatura Bird ID ainda não está configurada neste ambiente. O VIDaaS permanece disponível."
        : directivesUnavailable
          ? "Não há diretivas antecipadas disponíveis na prévia mais recente. Atualize a prévia e revise a aba de diretivas antes de assinar."
          : "Não foi possível iniciar a assinatura digital das diretivas antecipadas com o Bird ID.",
    }, { status: notConfigured ? 503 : 400 });
  }
}

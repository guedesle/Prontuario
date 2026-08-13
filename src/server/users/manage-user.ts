import { prisma } from "../db";
import { requireAuthenticatedUser } from "../auth/require-user";
import {
  assertCanChangeAdminState,
  assertRecentAuthentication,
  type UserRole,
} from "../../domain/security/auth-policy";

export async function updateClinicalUserAccess(input: {
  targetUserId: string;
  nextRole?: UserRole;
  nextActive?: boolean;
  requestId?: string;
}) {
  const { session, user: actor } = await requireAuthenticatedUser("user.manage");
  assertRecentAuthentication({
    authenticatedAt: new Date(session.session.createdAt),
    maxAgeSeconds: 10 * 60,
  });

  return prisma.$transaction(async (tx) => {
    const [target, activeAdmins] = await Promise.all([
      tx.user.findUnique({ where: { id: input.targetUserId } }),
      tx.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } }),
    ]);
    if (!target) throw new Error("Usuário alvo não encontrado.");

    assertCanChangeAdminState({
      targetUserId: target.id,
      targetRole: target.role,
      targetActive: target.active,
      nextRole: input.nextRole,
      nextActive: input.nextActive,
      activeAdminIds: activeAdmins.map((item) => item.id),
    });

    const updated = await tx.user.update({
      where: { id: target.id },
      data: {
        ...(input.nextRole ? { role: input.nextRole } : {}),
        ...(input.nextActive !== undefined ? { active: input.nextActive } : {}),
      },
      select: { id: true, email: true, name: true, role: true, active: true },
    });

    // Mudanças de privilégio ou desativação invalidam todas as sessões do usuário.
    if (input.nextRole !== undefined || input.nextActive === false) {
      await tx.session.deleteMany({ where: { userId: target.id } });
    }

    await tx.auditEvent.create({
      data: {
        userId: actor.id,
        entityType: "User",
        entityId: target.id,
        action: "user.access.update",
        requestId: input.requestId,
        outcome: "success",
        reasonCode: input.nextActive === false ? "USER_DISABLED" : "ACCESS_CHANGED",
      },
    });

    return updated;
  });
}

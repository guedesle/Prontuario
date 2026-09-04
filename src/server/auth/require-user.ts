import { headers } from "next/headers";
import { auth, isAuthorizedEmail } from "./auth";
import { prisma } from "../db";
import {
  assertPermission,
  type Permission,
} from "../../domain/security/auth-policy";
import { AccessForbiddenError, AuthenticationRequiredError } from "./access-errors";

export async function requireAuthenticatedUser(permission?: Permission) {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });

  if (!session?.user?.id) {
    throw new AuthenticationRequiredError();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  if (!user) throw new AccessForbiddenError();

  try {
    if (!user.active || !isAuthorizedEmail(user.email)) {
      throw new Error("Usuário inativo ou fora do contrato de acesso autorizado.");
    }

    if (permission) assertPermission(user.role, permission);
  } catch {
    throw new AccessForbiddenError();
  }

  return { session, user };
}

import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "../db";
import {
  assertActiveAllowedUser,
  assertPermission,
  parseEmailSet,
  type Permission,
} from "../../domain/security/auth-policy";

export async function requireAuthenticatedUser(permission?: Permission) {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });

  if (!session?.user?.id) {
    throw new Error("Autenticação obrigatória.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  if (!user) throw new Error("Usuário autenticado não encontrado.");

  assertActiveAllowedUser({
    user,
    allowedEmails: parseEmailSet(process.env.AUTH_ALLOWED_EMAILS),
  });

  if (permission) assertPermission(user.role, permission);

  return { session, user };
}

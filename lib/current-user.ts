import { prisma } from "./db";

/**
 * Returns the demo seller for this instance.
 * Auth is handled externally (Twilio SSO), so we always operate as the first seller in the DB.
 */
export async function getCurrentUser() {
  const seller = await prisma.seller.findFirst({ orderBy: { createdAt: "asc" } });
  if (!seller) throw new Error("No seller found — run: npx prisma db seed");
  return { id: seller.id, name: seller.name, email: seller.email };
}

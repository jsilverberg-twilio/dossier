import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const user = await getCurrentUser();
  const { id, sectionId } = await params;
  const room = await prisma.room.findFirst({ where: { id, sellerId: user.id } });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.section.deleteMany({ where: { id: sectionId, roomId: id } });
  return NextResponse.json({ ok: true });
}

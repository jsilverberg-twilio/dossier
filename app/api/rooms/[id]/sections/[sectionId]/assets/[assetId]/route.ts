import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; assetId: string }> }
) {
  const user = await getCurrentUser();
  const { id, sectionId, assetId } = await params;
  const room = await prisma.room.findFirst({ where: { id, sellerId: user.id } });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.asset.deleteMany({ where: { id: assetId, sectionId } });
  return NextResponse.json({ ok: true });
}

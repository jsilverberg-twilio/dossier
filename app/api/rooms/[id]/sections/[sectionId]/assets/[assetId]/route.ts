import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { LocalStorage } from "@/lib/storage";

const storage = new LocalStorage();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; assetId: string }> }
) {
  // Demo auth: getCurrentUser() returns the first seller in the DB.
  // Room ownership check below is the real access gate.
  const user = await getCurrentUser();
  const { id, sectionId, assetId } = await params;
  const room = await prisma.room.findFirst({ where: { id, sellerId: user.id } });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const order = body?.order;
  if (typeof order !== "number") {
    return NextResponse.json({ error: "order must be a number" }, { status: 400 });
  }
  await prisma.asset.updateMany({ where: { id: assetId, sectionId }, data: { order } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; assetId: string }> }
) {
  const user = await getCurrentUser();
  const { id, sectionId, assetId } = await params;
  const room = await prisma.room.findFirst({ where: { id, sellerId: user.id } });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Fetch fileKey before deleting so we can clean up the uploaded file.
  const asset = await prisma.asset.findFirst({ where: { id: assetId, sectionId } });
  await prisma.asset.deleteMany({ where: { id: assetId, sectionId } });
  if (asset?.fileKey) {
    try { await storage.delete(asset.fileKey); } catch {}
  }
  return NextResponse.json({ ok: true });
}

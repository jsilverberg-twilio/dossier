import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const room = await prisma.room.findFirst({
    where: { id, sellerId: user.id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { assets: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(room);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const data = await req.json();
  const room = await prisma.room.updateMany({
    where: { id, sellerId: user.id },
    data,
  });
  if (!room.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  await prisma.room.deleteMany({ where: { id, sellerId: user.id } });
  return NextResponse.json({ ok: true });
}

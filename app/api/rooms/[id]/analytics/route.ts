import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getRoomAnalytics } from "@/lib/events";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const room = await prisma.room.findFirst({ where: { id, sellerId: user.id } });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const analytics = await getRoomAnalytics(id);
  return NextResponse.json(analytics);
}

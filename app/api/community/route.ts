import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const tag = searchParams.get("tag") ?? "";

  const communityRooms = await prisma.communityRoom.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {},
        tag ? { tags: { contains: tag } } : {},
      ],
    },
    include: {
      seller: { select: { name: true } },
      room: {
        include: {
          sections: {
            include: {
              assets: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = communityRooms.map((cr) => ({
    id: cr.id,
    title: cr.title,
    description: cr.description,
    tags: JSON.parse(cr.tags) as string[],
    cloneCount: cr.cloneCount,
    viewCount: cr.viewCount,
    sellerName: cr.seller.name,
    sectionCount: cr.room.sections.length,
    assetCount: cr.room.sections.reduce((sum, s) => sum + s.assets.length, 0),
    createdAt: cr.createdAt,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { roomId, title, description, tags } = await req.json();
  if (!roomId || !title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const room = await prisma.room.findFirst({
    where: { id: roomId, sellerId: user.id },
  });
  if (!room) {
    return NextResponse.json({ error: "Room not found or access denied" }, { status: 404 });
  }

  const existing = await prisma.communityRoom.findUnique({ where: { roomId } });
  if (existing) {
    return NextResponse.json({ error: "Room already shared to community" }, { status: 409 });
  }

  const communityRoom = await prisma.communityRoom.create({
    data: {
      roomId,
      sellerId: user.id,
      title,
      description,
      tags: JSON.stringify(Array.isArray(tags) ? tags : []),
    },
  });

  return NextResponse.json(communityRoom, { status: 201 });
}

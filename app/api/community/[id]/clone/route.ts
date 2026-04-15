import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const communityRoom = await prisma.communityRoom.findUnique({
    where: { id },
    include: {
      room: {
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              assets: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!communityRoom) {
    return NextResponse.json({ error: "Community room not found" }, { status: 404 });
  }

  const sourceRoom = communityRoom.room;
  const slug = await uniqueSlug("New Customer");

  const newRoom = await prisma.room.create({
    data: {
      sellerId: user.id,
      name: sourceRoom.name,
      customerName: "New Customer",
      description: sourceRoom.description,
      slug,
      status: "draft",
    },
  });

  for (const section of sourceRoom.sections) {
    const newSection = await prisma.section.create({
      data: {
        roomId: newRoom.id,
        title: section.title,
        order: section.order,
        audienceTag: section.audienceTag,
      },
    });

    for (const asset of section.assets) {
      await prisma.asset.create({
        data: {
          sectionId: newSection.id,
          type: asset.type,
          sourceType: asset.sourceType,
          sourceRef: asset.sourceRef,
          title: asset.title,
          description: asset.description,
          url: asset.url,
          fileKey: asset.fileKey,
          metadata: asset.metadata,
          order: asset.order,
        },
      });
    }
  }

  await prisma.communityRoom.update({
    where: { id },
    data: { cloneCount: { increment: 1 } },
  });

  return NextResponse.json({ roomId: newRoom.id }, { status: 201 });
}

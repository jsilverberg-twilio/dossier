import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";

export async function GET() {
  const user = await getCurrentUser();
  const rooms = await prisma.room.findMany({
    where: { sellerId: user.id },
    include: { sections: { include: { assets: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(rooms);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { name, customerName, description, slug: customSlug } = await req.json();
  if (!name || !customerName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const slug = customSlug ? customSlug : await uniqueSlug(customerName);
  const room = await prisma.room.create({
    data: { name, customerName, description, slug, sellerId: user.id },
  });
  return NextResponse.json(room);
}

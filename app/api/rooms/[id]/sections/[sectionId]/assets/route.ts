import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LocalStorage } from "@/lib/storage";

const storage = new LocalStorage();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const { sectionId } = await params;

  const formData = await req.formData();
  const type = formData.get("type") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const sourceType = (formData.get("sourceType") as string) || "manual";
  const sourceRef = formData.get("sourceRef") as string | null;

  const maxOrder = await prisma.asset.aggregate({ where: { sectionId }, _max: { order: true } });
  const order = (maxOrder._max.order ?? -1) + 1;

  let fileKey: string | undefined;
  let url: string | undefined;

  if (type === "file") {
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    fileKey = await storage.upload(buffer, file.name);
    url = storage.getUrl(fileKey);
  } else if (type === "link") {
    url = formData.get("url") as string;
  }

  const content = type === "richtext" ? (formData.get("content") as string) : undefined;

  const asset = await prisma.asset.create({
    data: {
      sectionId,
      type,
      sourceType,
      sourceRef,
      title,
      description,
      url,
      fileKey,
      order,
      metadata: content ? JSON.stringify({ content }) : "{}",
    },
  });
  return NextResponse.json(asset);
}

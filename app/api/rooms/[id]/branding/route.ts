import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { LocalStorage } from "@/lib/storage";

const storage = new LocalStorage();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const room = await prisma.room.findFirst({
    where: { id, sellerId: user.id },
    select: { id: true, branding: true },
  });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();

  let existing: Record<string, string> = {};
  try {
    existing = JSON.parse(room.branding ?? "{}");
  } catch {
    existing = {};
  }

  const merged = { ...existing };

  const sellerFile = formData.get("sellerLogo");
  if (sellerFile instanceof File && sellerFile.size > 0) {
    if (existing.sellerLogoKey) {
      try { await storage.delete(existing.sellerLogoKey); } catch {}
    }
    const buffer = Buffer.from(await sellerFile.arrayBuffer());
    const key = await storage.upload(buffer, sellerFile.name);
    merged.sellerLogoKey = key;
    merged.sellerLogoUrl = storage.getUrl(key);
  }

  const customerFile = formData.get("customerLogo");
  if (customerFile instanceof File && customerFile.size > 0) {
    if (existing.customerLogoKey) {
      try { await storage.delete(existing.customerLogoKey); } catch {}
    }
    const buffer = Buffer.from(await customerFile.arrayBuffer());
    const key = await storage.upload(buffer, customerFile.name);
    merged.customerLogoKey = key;
    merged.customerLogoUrl = storage.getUrl(key);
  }

  const primaryColor = formData.get("primaryColor");
  if (typeof primaryColor === "string") merged.primaryColor = primaryColor;

  const companyName = formData.get("companyName");
  if (typeof companyName === "string") merged.companyName = companyName;

  await prisma.room.updateMany({
    where: { id, sellerId: user.id },
    data: { branding: JSON.stringify(merged) },
  });

  return NextResponse.json(merged);
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PortalContent } from "./portal-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatPrepDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export default async function CustomerPortalPage({ params }: PageProps) {
  const { slug } = await params;

  const room = await prisma.room.findUnique({
    where: { slug },
    include: {
      seller: true,
      sections: {
        orderBy: { order: "asc" },
        include: {
          assets: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!room || room.status !== "published") {
    notFound();
  }

  let branding: {
    sellerLogoUrl?: string;
    customerLogoUrl?: string;
    primaryColor?: string;
    companyName?: string;
  } = {};
  try {
    branding = JSON.parse(room.branding ?? "{}");
  } catch {
    branding = {};
  }

  return (
    <PortalContent
      roomId={room.id}
      roomName={room.name}
      customerName={room.customerName}
      prepDate={formatPrepDate(room.createdAt)}
      seller={{
        name: room.seller.name,
        email: room.seller.email,
        avatarUrl: room.seller.avatarUrl,
      }}
      sections={room.sections.map((s) => ({
        id: s.id,
        title: s.title,
        assets: s.assets.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          type: a.type,
          url: a.url,
          metadata: a.metadata,
          order: a.order,
        })),
      }))}
      branding={branding}
    />
  );
}

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getRoomAnalytics } from "@/lib/events";
import { RoomBuilderClient } from "./room-builder-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomBuilderPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id } = await params;

  const room = await prisma.room.findFirst({
    where: { id, sellerId: user.id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          assets: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!room) {
    notFound();
  }

  const analytics = await getRoomAnalytics(room.id);

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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const shareUrl = `${baseUrl}/r/${room.slug}`;

  return (
    <RoomBuilderClient
      roomId={room.id}
      roomName={room.name}
      roomSlug={room.slug}
      roomStatus={room.status}
      customerName={room.customerName}
      initialBranding={branding}
      initialSections={room.sections.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        assets: s.assets.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          url: a.url,
          metadata: a.metadata,
          order: a.order,
        })),
      }))}
      seller={{ name: user.name, email: user.email }}
      analytics={{
        totalViews: analytics.totalViews,
        uniqueVisitors: analytics.uniqueVisitors,
        downloads: analytics.downloads,
        linkClicks: analytics.linkClicks,
        lastActivity: analytics.lastActivity?.toISOString() ?? null,
        recentEvents: analytics.recentEvents.map((e) => ({
          id: e.id,
          action: e.action,
          timestamp: e.timestamp.toISOString(),
          asset: e.asset ?? null,
        })),
        sectionViews: analytics.sectionViews,
      }}
      shareUrl={shareUrl}
    />
  );
}

// lib/events/index.ts
import { prisma } from "@/lib/db";

type EventAction = "room_viewed" | "asset_viewed" | "asset_downloaded" | "link_clicked";

export async function captureEvent(params: {
  roomId: string;
  assetId?: string;
  visitorId: string;
  action: EventAction;
  ipHash?: string;
  userAgent?: string;
}) {
  return prisma.viewEvent.create({ data: params });
}

export async function getRoomAnalytics(roomId: string) {
  const [totalViews, uniqueVisitors, downloads, linkClicks, lastEvent, recentEvents, assetViewedEvents] =
    await Promise.all([
      prisma.viewEvent.count({ where: { roomId } }),
      prisma.viewEvent.groupBy({
        by: ["visitorId"],
        where: { roomId },
      }),
      prisma.viewEvent.count({
        where: { roomId, action: "asset_downloaded" },
      }),
      prisma.viewEvent.count({
        where: { roomId, action: "link_clicked" },
      }),
      prisma.viewEvent.findFirst({
        where: { roomId },
        orderBy: { timestamp: "desc" },
      }),
      prisma.viewEvent.findMany({
        where: { roomId },
        orderBy: { timestamp: "desc" },
        take: 20,
        include: { asset: { select: { title: true } } },
      }),
      prisma.viewEvent.findMany({
        where: { roomId, action: "asset_viewed" },
        include: { asset: { include: { section: { select: { title: true } } } } },
      }),
    ]);

  // Group asset_viewed events by section title
  const sectionViews: Record<string, number> = {};
  for (const ev of assetViewedEvents) {
    const sectionTitle = ev.asset?.section?.title;
    if (sectionTitle) {
      sectionViews[sectionTitle] = (sectionViews[sectionTitle] ?? 0) + 1;
    }
  }

  return {
    totalViews,
    uniqueVisitors: uniqueVisitors.length,
    downloads,
    linkClicks,
    lastActivity: lastEvent?.timestamp ?? null,
    recentEvents,
    sectionViews,
  };
}

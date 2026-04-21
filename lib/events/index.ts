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
        include: { asset: { include: { section: { select: { id: true, title: true } } } } },
      }),
    ]);

  // Group by sectionId first to prevent same-titled sections from merging.
  const sectionViewsById: Record<string, { title: string; count: number }> = {};
  for (const ev of assetViewedEvents) {
    const section = ev.asset?.section;
    if (section) {
      if (!sectionViewsById[section.id]) {
        sectionViewsById[section.id] = { title: section.title, count: 0 };
      }
      sectionViewsById[section.id].count++;
    }
  }
  const sectionViews = Object.values(sectionViewsById).sort((a, b) => b.count - a.count);

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

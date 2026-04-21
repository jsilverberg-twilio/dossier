import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getRoomAnalytics } from "@/lib/events";
import { LiveEventsFeed } from "./live-events-feed";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(date: Date | null): string {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(date);
}


const chevron = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-300">
    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
  </svg>
);

export default async function AnalyticsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id } = await params;

  const room = await prisma.room.findFirst({
    where: { id, sellerId: user.id },
    select: { id: true, name: true },
  });

  if (!room) notFound();

  const analytics = await getRoomAnalytics(room.id);

  const metrics = [
    { label: "Total Views", value: analytics.totalViews, highlight: true },
    { label: "Unique Visitors", value: analytics.uniqueVisitors, highlight: false },
    { label: "Downloads", value: analytics.downloads, highlight: false },
    { label: "Link Clicks", value: analytics.linkClicks, highlight: false },
  ];

  return (
    <div className="px-6 py-8 mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/dashboard" className="hover:text-slate-600 transition">Dashboard</Link>
        {chevron}
        <Link href={`/rooms/${id}`} className="hover:text-slate-600 transition truncate max-w-[200px]">{room.name}</Link>
        {chevron}
        <span className="text-slate-500">Analytics</span>
      </nav>

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">{room.name}</p>
        </div>
        <Link
          href={`/rooms/${id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
        >
          ← Room builder
        </Link>
      </div>

      {/* Metric cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`rounded-xl border p-4 ${m.highlight ? "bg-red-50 border-red-200" : "bg-white border-slate-200 shadow-sm"}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className={`mt-2 text-3xl font-bold ${m.highlight ? "text-red-600" : "text-slate-900"}`}>
              {m.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Last activity */}
      <p className="mb-6 text-xs text-slate-400">
        Last activity: <span className="font-medium text-slate-600">{formatDate(analytics.lastActivity)}</span>
      </p>

      {/* Views by section */}
      {analytics.sectionViews.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Views by Section</p>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            {(() => {
              const max = analytics.sectionViews[0]?.count ?? 1;
              return analytics.sectionViews.map(({ title, count }) => (
                <div key={title}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-700 truncate flex-1 mr-3">{title}</p>
                    <p className="text-sm font-bold text-slate-900 shrink-0">{count}</p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${Math.round((count / max) * 100)}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Live event feed */}
      <LiveEventsFeed roomId={room.id} />
    </div>
  );
}

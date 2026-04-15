import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getRoomAnalytics } from "@/lib/events";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(date: Date | null): string {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function ActionIcon({ action }: { action: string }) {
  if (action === "room_viewed") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 text-blue-400"
      >
        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
        <path
          fillRule="evenodd"
          d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (action === "asset_downloaded") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 text-green-400"
      >
        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
      </svg>
    );
  }
  if (action === "link_clicked") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 text-purple-400"
      >
        <path
          fillRule="evenodd"
          d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  // asset_viewed (default)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 text-yellow-400"
    >
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function actionLabel(action: string, assetTitle: string | null): string {
  switch (action) {
    case "room_viewed":
      return "Viewed room";
    case "asset_viewed":
      return `Viewed ${assetTitle ?? "asset"}`;
    case "asset_downloaded":
      return `Downloaded ${assetTitle ?? "asset"}`;
    case "link_clicked":
      return `Clicked ${assetTitle ?? "asset"}`;
    default:
      return action;
  }
}

export default async function AnalyticsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id } = await params;

  const room = await prisma.room.findFirst({
    where: { id, sellerId: user.id },
    select: { id: true, name: true },
  });

  if (!room) {
    notFound();
  }

  const analytics = await getRoomAnalytics(room.id);

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-300 transition">
            Dashboard
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
          <Link
            href={`/rooms/${id}`}
            className="hover:text-gray-300 transition truncate max-w-xs"
          >
            {room.name}
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-300">Analytics</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="mt-1 text-sm text-gray-400">{room.name}</p>
          </div>
          <Link
            href={`/rooms/${id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            Room builder
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total views
            </p>
            <p className="mt-2 text-3xl font-bold text-white">
              {analytics.totalViews.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Unique visitors
            </p>
            <p className="mt-2 text-3xl font-bold text-white">
              {analytics.uniqueVisitors.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Downloads
            </p>
            <p className="mt-2 text-3xl font-bold text-white">
              {analytics.downloads.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Last activity
            </p>
            <p className="mt-2 text-sm font-semibold text-white leading-snug">
              {formatDate(analytics.lastActivity)}
            </p>
          </div>
        </div>

        {/* Recent Events Feed */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Recent activity
          </h2>
          {analytics.recentEvents.length === 0 ? (
            <div className="rounded-xl bg-gray-900 border border-gray-800 px-6 py-12 text-center">
              <p className="text-gray-500">No activity yet.</p>
              <p className="mt-1 text-sm text-gray-600">
                Share the room link with your customer to start tracking.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-gray-900 border border-gray-800 divide-y divide-gray-800">
              {analytics.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <div className="shrink-0">
                    <ActionIcon action={event.action} />
                  </div>
                  <p className="flex-1 text-sm text-gray-200">
                    {actionLabel(event.action, event.asset?.title ?? null)}
                  </p>
                  <p className="shrink-0 text-xs text-gray-500">
                    {relativeTime(new Date(event.timestamp))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

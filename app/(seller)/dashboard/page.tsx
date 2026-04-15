import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import Link from "next/link";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-yellow-900/60 text-yellow-400 border border-yellow-800",
    published: "bg-green-900/60 text-green-400 border border-green-800",
    archived: "bg-gray-800 text-gray-400 border border-gray-700",
  };
  const labels: Record<string, string> = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.draft}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const rooms = await prisma.room.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        include: {
          assets: {
            select: { id: true },
          },
        },
      },
    },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return (
    <div className="px-6 py-8 mx-auto max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Rooms</h1>
          <p className="mt-1 text-sm text-gray-500">
            {rooms.length === 0
              ? "No rooms yet"
              : `${rooms.length} room${rooms.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/rooms/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Create Room
        </Link>
      </div>

      {/* Empty state */}
      {rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-900/40 py-24 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mb-4 h-12 w-12 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-lg font-medium text-gray-400">No rooms yet.</p>
          <p className="mt-1 text-sm text-gray-600">
            Create your first room to get started.
          </p>
          <Link
            href="/rooms/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create your first room
          </Link>
        </div>
      )}

      {/* Room cards grid */}
      {rooms.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const sectionCount = room.sections.length;
            const assetCount = room.sections.reduce(
              (sum, s) => sum + s.assets.length,
              0
            );
            const shareUrl = `${baseUrl}/r/${room.slug}`;

            return (
              <div
                key={room.id}
                className="flex flex-col rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-gray-700 hover:bg-gray-800/60"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-white leading-snug">
                      {room.name}
                    </h2>
                    <p className="mt-0.5 truncate text-sm text-gray-400">
                      {room.customerName}
                    </p>
                  </div>
                  <StatusBadge status={room.status} />
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>
                    {sectionCount} section{sectionCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-gray-700">·</span>
                  <span>
                    {assetCount} asset{assetCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-gray-700">·</span>
                  <span>{formatDate(room.createdAt)}</span>
                </div>

                {/* Shareable link (published only) */}
                {room.status === "published" && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-800/80 border border-gray-700 px-3 py-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5 text-green-400 shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-xs text-blue-400 hover:text-blue-300 transition font-mono"
                    >
                      {shareUrl}
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-3 border-t border-gray-800 flex items-center gap-2">
                  <Link
                    href={`/rooms/${room.id}`}
                    className="flex-1 rounded-lg border border-gray-700 px-3 py-1.5 text-center text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:text-white hover:bg-gray-800"
                  >
                    Edit
                  </Link>
                  {room.status === "published" && (
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-lg border border-green-800 px-3 py-1.5 text-center text-xs font-medium text-green-400 transition hover:border-green-700 hover:bg-green-900/30"
                    >
                      View live
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

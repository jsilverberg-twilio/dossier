import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { SectionList } from "./components/SectionList";
import { PublishButton } from "./components/PublishButton";
import { ShareToCommunity } from "./components/ShareToCommunity";
import { BrandingEditor } from "./components/BrandingEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

export default async function RoomBuilderPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const { id } = await params;

  const room = await prisma.room.findFirst({
    where: { id, sellerId: user.id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          assets: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!room) {
    notFound();
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const shareUrl = `${baseUrl}/r/${room.slug}`;

  return (
    <div className="px-6 py-8 mx-auto max-w-4xl">
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
        <span className="text-gray-300 truncate max-w-xs">{room.name}</span>
      </nav>

      {/* Room Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{room.name}</h1>
            <StatusBadge status={room.status} />
          </div>
          <p className="text-sm text-gray-400">
            Customer:{" "}
            <span className="text-gray-200">{room.customerName}</span>
          </p>
          {room.description && (
            <p className="mt-2 text-sm text-gray-500 max-w-xl">
              {room.description}
            </p>
          )}
        </div>

        {/* Publish / Unpublish + share actions */}
        <div className="shrink-0 flex items-center gap-2 flex-wrap justify-end">
          <ShareToCommunity roomId={room.id} roomName={room.name} />
          <PublishButton
            roomId={room.id}
            status={room.status}
            shareUrl={shareUrl}
          />
        </div>
      </div>

      {/* Shareable Link (when published) */}
      {room.status === "published" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-800/60 bg-green-900/20 px-4 py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 text-green-400 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-green-500 font-medium mb-0.5">
              Shareable link
            </p>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 font-mono truncate block"
            >
              {shareUrl}
            </a>
          </div>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-green-800 px-3 py-1.5 text-xs font-medium text-green-400 transition hover:border-green-700 hover:bg-green-900/40"
          >
            View live
          </a>
        </div>
      )}

      {/* Branding */}
      <div className="mb-8">
        <BrandingEditor
          roomId={room.id}
          initialBranding={(() => {
            try { return JSON.parse(room.branding); } catch { return {}; }
          })()}
        />
      </div>

      {/* Sections + Assets */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Sections &amp; Assets
        </h2>
        <SectionList
          roomId={room.id}
          initialSections={room.sections}
        />
      </div>
    </div>
  );
}

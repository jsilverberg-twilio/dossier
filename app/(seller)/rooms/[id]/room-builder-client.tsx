"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RoomProvider, useRoom, type Section } from "./context";
import { getThumbGrad, getThumbLabel, relTime, eventLabel } from "@/lib/assets";
import { SectionList } from "./components/SectionList";
import { BrandingEditor } from "./components/BrandingEditor";
import { PublishButton } from "./components/PublishButton";
import { ShareToCommunity } from "./components/ShareToCommunity";

type EditorTab = "content" | "branding" | "analytics";

interface Branding {
  sellerLogoUrl?: string;
  customerLogoUrl?: string;
  primaryColor?: string;
  companyName?: string;
}

interface AnalyticsEvent {
  id: string;
  action: string;
  timestamp: string;
  asset?: { title: string } | null;
}

interface Analytics {
  totalViews: number;
  uniqueVisitors: number;
  downloads: number;
  linkClicks: number;
  lastActivity: string | null;
  recentEvents: AnalyticsEvent[];
  sectionViews: Array<{ title: string; count: number }>;
}

interface Seller {
  name: string;
  email: string;
}

interface RoomBuilderClientProps {
  roomId: string;
  roomName: string;
  roomSlug: string;
  roomStatus: string;
  customerName: string;
  initialBranding: Branding;
  initialSections: Section[];
  seller: Seller;
  analytics: Analytics;
  shareUrl: string;
}

// ── Buyer Preview (reads from RoomContext) ─────────────────────────────
function BuyerPreview({
  roomName,
  customerName,
  branding,
  seller,
  slug,
}: {
  roomName: string;
  customerName: string;
  branding: Branding;
  seller: Seller;
  slug: string;
}) {
  const { sections } = useRoom();
  const [activeIdx, setActiveIdx] = useState(0);
  // Clamp at render time so the preview never goes blank after a section is deleted.
  const safeIdx = sections.length > 0 ? Math.min(activeIdx, sections.length - 1) : 0;

  const brandColor = branding.primaryColor ?? "#ef4444";
  const companyLabel = branding.companyName || "Twilio";
  const activeSection: Section | null = sections[safeIdx] ?? null;
  const sellerInitials = seller.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Preview toolbar */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
          <span>👁</span> Buyer View
        </span>
        <Link
          href={`/r/${slug}`}
          target="_blank"
          className="text-xs font-semibold text-red-500 hover:text-red-600 transition"
        >
          Open in new tab ↗
        </Link>
      </div>

      {/* Preview frame */}
      <div className="flex-1 overflow-y-auto bg-slate-100 p-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
          {/* Room header */}
          <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {branding.sellerLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.sellerLogoUrl} alt={companyLabel} className="h-6 w-auto max-w-[80px] object-contain" />
              ) : (
                <div className="h-6 px-2 bg-red-500 rounded text-white text-[10px] font-black flex items-center">
                  {companyLabel.toUpperCase().slice(0, 6)}
                </div>
              )}
              <div className="w-px h-4 bg-slate-200" />
              {branding.customerLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.customerLogoUrl} alt={customerName} className="h-6 w-auto max-w-[80px] object-contain" />
              ) : (
                <div className="h-6 px-2 bg-slate-100 rounded text-slate-500 text-[10px] font-bold flex items-center">
                  {customerName.toUpperCase().slice(0, 6)}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-900">{roomName}</p>
              <p className="text-[10px] text-slate-400">Prepared by {seller.name}</p>
            </div>
          </div>

          {/* Section tabs */}
          {sections.length > 0 && (
            <div className="flex gap-0 border-b border-slate-100 px-3 bg-slate-50 overflow-x-auto">
              {sections.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    idx === safeIdx ? "text-red-500 border-red-500" : "text-slate-400 border-transparent"
                  }`}
                >
                  {s.title}
                  <span className="text-[9px] font-bold">{s.assets.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {sections.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">
                No sections yet — add one in the editor →
              </p>
            ) : activeSection ? (
              <>
                <p className="text-xs font-extrabold text-slate-900 mb-3">{activeSection.title}</p>
                <div className="space-y-2">
                  {activeSection.assets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50">
                      <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${getThumbGrad(asset.type, asset.metadata)} flex items-center justify-center text-[8px] font-black text-white shrink-0`}>
                        {getThumbLabel(asset.type, asset.metadata)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-700 truncate">{asset.title}</p>
                      </div>
                    </div>
                  ))}
                  {activeSection.assets.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">No assets</p>
                  )}
                </div>
              </>
            ) : null}

            {/* Seller contact */}
            {sections.length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    {sellerInitials}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900">{seller.name}</p>
                    <p className="text-[10px] text-red-500">{seller.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="px-2 py-1 rounded border border-slate-200 text-[9px] font-semibold text-slate-500">Schedule</span>
                  <span className="px-2 py-1 rounded bg-red-500 text-white text-[9px] font-semibold">Email</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Analytics Tab ──────────────────────────────────────────────────────
function AnalyticsTab({ analytics: initialAnalytics, roomId }: { analytics: Analytics; roomId: string }) {
  const [analytics, setAnalytics] = useState<Analytics>(initialAnalytics);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/analytics`);
        if (res.ok) setAnalytics(await res.json());
      } catch {}
    }
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const hasData = analytics.totalViews > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-sm font-medium text-slate-500">Publish your room to start tracking engagement.</p>
      </div>
    );
  }

  const metrics = [
    { label: "Total Views", value: analytics.totalViews, highlight: true },
    { label: "Visitors", value: analytics.uniqueVisitors, highlight: false },
    { label: "Downloads", value: analytics.downloads, highlight: false },
    { label: "Link Clicks", value: analytics.linkClicks, highlight: false },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* 2x2 metric grid */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`rounded-xl border p-3 ${m.highlight ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className={`text-2xl font-bold mt-1 ${m.highlight ? "text-red-600" : "text-slate-900"}`}>{m.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Views by section */}
      {analytics.sectionViews.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Views by Section</p>
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            {(() => {
              const maxViews = analytics.sectionViews[0]?.count ?? 1;
              return analytics.sectionViews.map(({ title, count }) => (
                <div key={title}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-medium text-slate-600 truncate flex-1 mr-2">{title}</p>
                    <p className="text-[11px] font-bold text-slate-900 shrink-0">{count}</p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all"
                      style={{ width: `${Math.round((count / maxViews) * 100)}%` }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Recent Activity</p>
          <Link href={`/rooms/${roomId}/analytics`} className="text-xs text-red-500 font-semibold hover:text-red-600">
            View full →
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
          {analytics.recentEvents.slice(0, 10).map((ev) => (
            <div key={ev.id} className="flex items-center gap-2 px-3 py-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-slate-500">
                  {ev.action === "room_viewed" ? "👁" : ev.action === "link_clicked" ? "↗" : "⬇"}
                </span>
              </div>
              <p className="flex-1 text-xs text-slate-600 truncate">{eventLabel(ev.action, ev.asset?.title)}</p>
              <p className="text-[10px] text-slate-400 shrink-0">{relTime(ev.timestamp)}</p>
            </div>
          ))}
          {analytics.recentEvents.length === 0 && (
            <p className="px-3 py-4 text-xs text-slate-400 text-center">No events yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Content Tab branding summary ────────────────────────────────────────
function BrandingSummaryCard({
  branding,
  onBrandingClick,
}: {
  branding: Branding;
  onBrandingClick: () => void;
}) {
  return (
    <button
      onClick={onBrandingClick}
      className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-3 text-left hover:border-slate-300 transition"
    >
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5">
        <span className="text-xs">🎨</span>
        <span className="text-xs font-bold text-slate-600">Branding</span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-1">Seller Logo</p>
          {branding.sellerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.sellerLogoUrl} alt="" className="h-6 object-contain" />
          ) : (
            <span className="text-[10px] text-amber-500 font-semibold">⚠ Missing</span>
          )}
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-1">Customer</p>
          {branding.customerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.customerLogoUrl} alt="" className="h-6 object-contain" />
          ) : (
            <span className="text-[10px] text-amber-500 font-semibold">⚠ Missing</span>
          )}
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-1">Accent</p>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: branding.primaryColor ?? "#ef4444" }} />
            <span className="text-[10px] text-slate-500 font-mono">{(branding.primaryColor ?? "#ef4444").toUpperCase()}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Editor Panel ───────────────────────────────────────────────────────
function EditorPanel({
  roomId,
  roomName,
  roomStatus,
  shareUrl,
  branding,
  onBrandingChange,
  analytics,
}: {
  roomId: string;
  roomName: string;
  roomStatus: string;
  shareUrl: string;
  branding: Branding;
  onBrandingChange: (updated: Branding) => void;
  analytics: Analytics;
}) {
  const [tab, setTab] = useState<EditorTab>("content");
  const [status, setStatus] = useState(roomStatus);

  const statusLabel = status === "published" ? "Live" : "Draft";
  const statusClass = status === "published"
    ? "bg-green-100 text-green-700 border border-green-200"
    : "bg-yellow-100 text-yellow-700 border border-yellow-200";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Room controls header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-slate-900 truncate">{roomName}</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ShareToCommunity roomId={roomId} roomName={roomName} />
          <PublishButton roomId={roomId} status={status} onStatusChange={setStatus} shareUrl={shareUrl} />
        </div>
      </div>

      {/* Editor tabs */}
      <div className="shrink-0 bg-white border-b border-slate-100 flex px-4">
        {(["content", "branding", "analytics"] as EditorTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition capitalize ${
              tab === t ? "text-red-500 border-red-500" : "text-slate-400 border-transparent hover:text-slate-600"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "content" && (
          <div className="p-3">
            <BrandingSummaryCard branding={branding} onBrandingClick={() => setTab("branding")} />
            <SectionList />
          </div>
        )}
        {tab === "branding" && (
          <BrandingEditor roomId={roomId} initialBranding={branding} onSaved={onBrandingChange} />
        )}
        {tab === "analytics" && (
          <AnalyticsTab analytics={analytics} roomId={roomId} />
        )}
      </div>
    </div>
  );
}

// ── Main exported component ────────────────────────────────────────────
export function RoomBuilderClient({
  roomId,
  roomName,
  roomSlug,
  roomStatus,
  customerName,
  initialBranding,
  initialSections,
  seller,
  analytics,
  shareUrl,
}: RoomBuilderClientProps) {
  const [branding, setBranding] = useState<Branding>(initialBranding);

  return (
    <RoomProvider roomId={roomId} initialSections={initialSections}>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Left: Buyer View */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <BuyerPreview
            roomName={roomName}
            customerName={customerName}
            branding={branding}
            seller={seller}
            slug={roomSlug}
          />
        </div>

        {/* Right: Editor */}
        <div className="w-[380px] shrink-0 border-l border-slate-200 flex flex-col overflow-hidden">
          <EditorPanel
            roomId={roomId}
            roomName={roomName}
            roomStatus={roomStatus}
            shareUrl={shareUrl}
            branding={branding}
            onBrandingChange={setBranding}
            analytics={analytics}
          />
        </div>
      </div>
    </RoomProvider>
  );
}

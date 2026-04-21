"use client";

import { useState } from "react";
import { RoomTracker, AssetTrackerButton } from "./tracker";

interface Asset {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  metadata: string;
  order: number;
}

interface Section {
  id: string;
  title: string;
  assets: Asset[];
}

interface Seller {
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface Branding {
  sellerLogoUrl?: string;
  customerLogoUrl?: string;
  primaryColor?: string;
  companyName?: string;
}

interface PortalContentProps {
  roomId: string;
  roomName: string;
  customerName: string;
  prepDate: string;
  seller: Seller;
  sections: Section[];
  branding: Branding;
}

function getThumbnail(type: string, metadata: string): { gradient: string; label: string } {
  if (type === "link") return { gradient: "from-blue-500 to-blue-700", label: "↗" };
  if (type === "richtext") return { gradient: "from-purple-500 to-purple-700", label: "NOTE" };
  let parsed: { fileName?: string } = {};
  try { parsed = JSON.parse(metadata ?? "{}"); } catch {}
  const ext = parsed.fileName?.split(".").pop()?.toUpperCase() ?? "FILE";
  if (ext === "PDF") return { gradient: "from-red-500 to-red-700", label: "PDF" };
  if (["PPTX", "PPT"].includes(ext)) return { gradient: "from-orange-500 to-orange-700", label: ext };
  return { gradient: "from-slate-500 to-slate-700", label: ext.slice(0, 4) };
}

function getBadgeColor(type: string, metadata: string): string {
  if (type === "link") return "bg-blue-500";
  if (type === "richtext") return "bg-purple-500";
  let parsed: { fileName?: string } = {};
  try { parsed = JSON.parse(metadata ?? "{}"); } catch {}
  const ext = parsed.fileName?.split(".").pop()?.toUpperCase() ?? "";
  if (ext === "PDF") return "bg-red-500";
  if (["PPTX", "PPT"].includes(ext)) return "bg-orange-500";
  return "bg-slate-500";
}

function getBadgeLabel(type: string, metadata: string): string {
  if (type === "link") return "LINK";
  if (type === "richtext") return "NOTE";
  let parsed: { fileName?: string } = {};
  try { parsed = JSON.parse(metadata ?? "{}"); } catch {}
  return parsed.fileName?.split(".").pop()?.toUpperCase()?.slice(0, 5) ?? "FILE";
}

function getMetaText(type: string, metadata: string): string {
  if (type === "link") {
    let parsed: { url?: string } = {};
    try { parsed = JSON.parse(metadata ?? "{}"); } catch {}
    try { return new URL(parsed.url ?? "").hostname; } catch { return ""; }
  }
  let parsed: { fileName?: string; fileSize?: number } = {};
  try { parsed = JSON.parse(metadata ?? "{}"); } catch {}
  const parts: string[] = [];
  if (parsed.fileSize) {
    const mb = parsed.fileSize / (1024 * 1024);
    parts.push(mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(parsed.fileSize / 1024)} KB`);
  }
  return parts.join(" · ");
}

export function PortalContent({
  roomId,
  roomName,
  customerName,
  prepDate,
  seller,
  sections,
  branding,
}: PortalContentProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const brandColor = branding.primaryColor ?? "#ef4444";
  const companyLabel = branding.companyName || "Twilio";
  const activeSection = sections[activeIdx] ?? null;
  const sellerFirstName = seller.name.split(" ")[0];
  const sellerInitials = seller.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <RoomTracker roomId={roomId} />

      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-white border-b border-slate-200 shadow-sm px-8 flex items-center justify-between">
        {/* Left: co-branded logos */}
        <div className="flex items-center gap-4">
          {branding.sellerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.sellerLogoUrl} alt={companyLabel} className="h-8 w-auto max-w-[120px] object-contain" />
          ) : (
            <div className="h-8 px-3 bg-red-500 rounded-md flex items-center justify-center text-white text-xs font-black tracking-wide">
              {companyLabel.toUpperCase().slice(0, 8)}
            </div>
          )}
          <div className="w-px h-6 bg-slate-200" />
          {branding.customerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.customerLogoUrl} alt={customerName} className="h-8 w-auto max-w-[120px] object-contain" />
          ) : (
            <div className="h-8 px-3 bg-slate-100 rounded-md flex items-center justify-center text-slate-500 text-xs font-bold tracking-wide">
              {customerName.toUpperCase().slice(0, 8)}
            </div>
          )}
        </div>

        {/* Right: room name + prep info */}
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">{roomName}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Prepared by {seller.name} · {prepDate}
          </p>
        </div>
      </header>

      {/* Section tab nav */}
      <div className="sticky top-16 z-40 bg-white border-b border-slate-200 px-8 flex items-end gap-0 overflow-x-auto">
        {sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => setActiveIdx(idx)}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              idx === activeIdx
                ? "text-red-500 border-red-500"
                : "text-slate-400 border-transparent hover:text-slate-600"
            }`}
          >
            {section.title}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                idx === activeIdx ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400"
              }`}
            >
              {section.assets.length}
            </span>
          </button>
        ))}
      </div>

      {/* Content area */}
      {activeSection ? (
        <div className="max-w-[900px] mx-auto px-8 py-10">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-7">{activeSection.title}</h2>

          {/* Asset grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-10">
            {activeSection.assets.map((asset) => {
              const { gradient, label } = getThumbnail(asset.type, asset.metadata);
              const badgeColor = getBadgeColor(asset.type, asset.metadata);
              const badgeLabel = getBadgeLabel(asset.type, asset.metadata);
              const metaText = getMetaText(asset.type, asset.metadata);
              const isFile = asset.type === "file";
              const isLink = asset.type === "link";
              const hasAction = isFile || isLink;
              const actionLabel = isFile ? "⬇ Download" : "↗ Open Link";
              const trackAction: "asset_viewed" | "link_clicked" = isLink ? "link_clicked" : "asset_viewed";

              return (
                <div
                  key={asset.id}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:-translate-y-px hover:border-red-300 hover:shadow-md hover:shadow-red-100"
                >
                  {/* Gradient strip */}
                  <div
                    className={`h-[100px] bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-3xl tracking-tight select-none`}
                  >
                    {label}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col">
                    <span
                      className={`self-start text-[9px] font-black text-white px-2 py-0.5 rounded mb-2 tracking-wide ${badgeColor}`}
                    >
                      {badgeLabel}
                    </span>
                    <p className="text-sm font-bold text-slate-900 leading-snug mb-1">{asset.title}</p>
                    {asset.description && (
                      <p className="text-xs text-slate-500 leading-relaxed flex-1">{asset.description}</p>
                    )}
                    {!asset.description && <div className="flex-1" />}
                    {metaText && <p className="text-[10px] text-slate-400 mt-2">{metaText}</p>}
                  </div>

                  {/* Action button */}
                  {hasAction && (
                    <AssetTrackerButton
                      roomId={roomId}
                      assetId={asset.id}
                      action={trackAction}
                      href={asset.url ?? undefined}
                      className="w-full bg-red-500 text-white rounded-b-2xl py-2.5 text-sm font-bold text-center hover:bg-red-600 transition-colors"
                    >
                      {actionLabel}
                    </AssetTrackerButton>
                  )}
                </div>
              );
            })}
          </div>

          {/* Seller contact strip */}
          <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-base font-black text-white shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                {sellerInitials}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{seller.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Account Executive · Twilio</p>
                <p className="text-xs text-red-500 font-medium mt-0.5">{seller.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-500 shadow-sm hover:border-slate-300 transition-colors">
                Schedule a call
              </button>
              <a
                href={`mailto:${seller.email}`}
                className="px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
              >
                ✉ Email {sellerFirstName}
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-[900px] mx-auto px-8 py-24 text-center">
          <p className="text-slate-400 text-sm">No sections yet.</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400 mt-10">
        Powered by <span className="text-red-500 font-semibold">Twilio Deal Room</span> · This room was prepared exclusively for {customerName}
      </div>
    </div>
  );
}

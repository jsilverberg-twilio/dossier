export function getThumbGrad(type: string, metadata: string): string {
  if (type === "link") return "from-blue-500 to-blue-700";
  if (type === "richtext") return "from-purple-500 to-purple-700";
  let parsed: { fileName?: string } = {};
  try { parsed = JSON.parse(metadata ?? "{}"); } catch {}
  const ext = parsed.fileName?.split(".").pop()?.toUpperCase() ?? "";
  if (ext === "PDF") return "from-red-500 to-red-700";
  if (["PPTX", "PPT"].includes(ext)) return "from-orange-500 to-orange-700";
  return "from-slate-400 to-slate-600";
}

export function getThumbLabel(type: string, metadata: string): string {
  if (type === "link") return "↗";
  if (type === "richtext") return "NOTE";
  let parsed: { fileName?: string } = {};
  try { parsed = JSON.parse(metadata ?? "{}"); } catch {}
  return parsed.fileName?.split(".").pop()?.toUpperCase()?.slice(0, 4) ?? "FILE";
}

export function relTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  if (s > 5) return `${s}s ago`;
  return "just now";
}

export function eventLabel(action: string, assetTitle?: string | null): string {
  switch (action) {
    case "room_viewed": return "Viewed room";
    case "asset_viewed": return `Viewed ${assetTitle ?? "asset"}`;
    case "asset_downloaded": return `Downloaded ${assetTitle ?? "asset"}`;
    case "link_clicked": return `Clicked ${assetTitle ?? "link"}`;
    default: return action;
  }
}

export function getMetaText(type: string, metadata: string): string {
  if (type === "link") {
    let parsed: { url?: string } = {};
    try { parsed = JSON.parse(metadata ?? "{}"); } catch {}
    try { return new URL(parsed.url ?? "").hostname; } catch { return ""; }
  }
  let parsed: { fileSize?: number; fileName?: string } = {};
  try { parsed = JSON.parse(metadata ?? "{}"); } catch {}
  if (parsed.fileSize) {
    const mb = parsed.fileSize / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(parsed.fileSize / 1024)} KB`;
  }
  return "";
}

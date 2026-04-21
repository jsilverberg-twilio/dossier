"use client";

import { useState } from "react";

interface PublishButtonProps {
  roomId: string;
  status: string;
  shareUrl: string;
  onStatusChange: (status: string) => void;
}

export function PublishButton({ roomId, status, shareUrl, onStatusChange }: PublishButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPublished = status === "published";

  async function togglePublish() {
    setLoading(true);
    const newStatus = isPublished ? "draft" : "published";
    await fetch(`/api/rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onStatusChange(newStatus);
    // Auto-copy the share link to clipboard when going live.
    if (newStatus === "published") {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {}
    }
    setLoading(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }

  if (isPublished) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
        >
          {copied ? "✓ Link copied!" : "Copy Link"}
        </button>
        <button
          onClick={togglePublish}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Updating…" : "Make Draft"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={togglePublish}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
    >
      {loading ? "Publishing…" : "Go Live"}
    </button>
  );
}

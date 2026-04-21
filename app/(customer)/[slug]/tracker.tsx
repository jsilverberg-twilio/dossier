"use client";

import { useEffect, useRef } from "react";

interface TrackerProps {
  roomId: string;
}

export function RoomTracker({ roomId }: TrackerProps) {
  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, action: "room_viewed" }),
    }).catch(() => {});
  }, [roomId]);

  return null;
}

interface AssetTrackerButtonProps {
  roomId: string;
  assetId: string;
  action: "asset_viewed" | "asset_downloaded" | "link_clicked";
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function AssetTrackerButton({
  roomId,
  assetId,
  action,
  href,
  className,
  style,
  children,
}: AssetTrackerButtonProps) {
  const handleClick = async () => {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, assetId, action }),
    }).catch(() => {});
    if (href) {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  // File assets: use <a download> so the browser actually saves the file.
  if (action === "asset_downloaded" && href) {
    return (
      <a
        href={href}
        download
        onClick={() => {
          fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, assetId, action }),
          }).catch(() => {});
        }}
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }

  return (
    <button onClick={handleClick} className={className} style={style}>
      {children}
    </button>
  );
}

interface AssetViewTrackerProps {
  roomId: string;
  assetId: string;
  children: React.ReactNode;
}

// Fires asset_viewed once when at least 50% of the card is visible in the viewport.
export function AssetViewTracker({ roomId, assetId, children }: AssetViewTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fired.current) {
          fired.current = true;
          fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, assetId, action: "asset_viewed" }),
          }).catch(() => {});
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [roomId, assetId]);

  return <div ref={ref}>{children}</div>;
}

"use client";

import { useEffect, useState, useRef } from "react";
import { relTime, eventLabel } from "@/lib/assets";

interface RawEvent {
  id: string;
  action: string;
  visitorId: string;
  assetId: string | null;
  timestamp: string;
  asset: { title: string; type: string } | null;
}

const ACTION_STYLE: Record<string, { icon: string; cls: string }> = {
  room_viewed:      { icon: "👁",  cls: "bg-blue-50 text-blue-500" },
  asset_viewed:     { icon: "📄",  cls: "bg-slate-100 text-slate-500" },
  asset_downloaded: { icon: "⬇",  cls: "bg-green-50 text-green-600" },
  link_clicked:     { icon: "↗",  cls: "bg-purple-50 text-purple-500" },
};

export function LiveEventsFeed({ roomId }: { roomId: string }) {
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(`/api/rooms/${roomId}/events`);
        if (!res.ok) throw new Error();
        const data: RawEvent[] = await res.json();

        const incoming = new Set(data.map((e) => e.id));
        const fresh = data.filter((e) => !knownIds.current.has(e.id) && knownIds.current.size > 0);
        if (fresh.length > 0) {
          setNewIds(new Set(fresh.map((e) => e.id)));
          setTimeout(() => setNewIds(new Set()), 2500);
        }
        knownIds.current = incoming;
        setEvents(data);
        setLastFetch(new Date());
        setError(false);
      } catch {
        setError(true);
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Live Events</p>
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-[10px] text-red-400 font-medium">polling error</span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              live · {lastFetch ? `updated ${relTime(lastFetch.toISOString())}` : "connecting…"}
            </span>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-slate-500 font-medium">No events yet.</p>
          <p className="mt-1 text-sm text-slate-400">Open the customer portal to start generating events.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
          {events.map((ev) => {
            const style = ACTION_STYLE[ev.action] ?? { icon: "•", cls: "bg-slate-100 text-slate-500" };
            const isNew = newIds.has(ev.id);
            const isOpen = expanded === ev.id;

            return (
              <div key={ev.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : ev.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isNew ? "bg-green-50" : "hover:bg-slate-50"}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${style.cls}`}>
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {eventLabel(ev.action, ev.asset?.title)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isNew && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">new</span>
                    )}
                    <p className="text-xs text-slate-400">{relTime(ev.timestamp)}</p>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                      className={`h-3.5 w-3.5 text-slate-300 transition-transform ${isOpen ? "rotate-90" : ""}`}>
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-3 pt-1 bg-slate-50 border-t border-slate-100 font-mono text-[11px] text-slate-500 space-y-1">
                    <p><span className="text-slate-400">id</span>        {ev.id}</p>
                    <p><span className="text-slate-400">action</span>    {ev.action}</p>
                    <p><span className="text-slate-400">visitorId</span> {ev.visitorId}</p>
                    {ev.assetId && <p><span className="text-slate-400">assetId</span>   {ev.assetId}</p>}
                    <p><span className="text-slate-400">timestamp</span> {new Date(ev.timestamp).toISOString()}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

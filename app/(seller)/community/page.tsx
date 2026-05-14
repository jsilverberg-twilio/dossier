"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AVAILABLE_TAGS } from "@/lib/community";

interface CommunityRoom {
  id: string;
  title: string;
  description: string;
  tags: string[];
  cloneCount: number;
  viewCount: number;
  sellerName: string;
  sectionCount: number;
  assetCount: number;
  createdAt: string;
}

export default function CommunityPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<CommunityRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [cloningId, setCloningId] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeTag) params.set("tag", activeTag);
    try {
      const res = await fetch(`/api/community?${params.toString()}`);
      if (res.ok) setRooms(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search, activeTag]);

  useEffect(() => {
    const timer = setTimeout(fetchRooms, 300);
    return () => clearTimeout(timer);
  }, [fetchRooms]);

  async function handleClone(roomId: string) {
    setCloningId(roomId);
    try {
      const res = await fetch(`/api/community/${roomId}/clone`, { method: "POST" });
      if (res.ok) {
        const { roomId: newRoomId } = await res.json();
        router.push(`/rooms/${newRoomId}`);
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to clone room");
      }
    } finally {
      setCloningId(null);
    }
  }

  return (
    <div className="px-6 py-8 mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Community Library</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse shared room templates. Clone any room to use as a starting point.
        </p>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          placeholder="Search by title or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition"
        />
      </div>

      {/* Tag filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", ...AVAILABLE_TAGS].map((tag) => {
          const active = tag === "All" ? activeTag === "" : activeTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === "All" ? "" : (activeTag === tag ? "" : tag))}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition border ${
                active
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <svg className="h-6 w-6 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Empty state */}
      {!loading && rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-24 text-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-lg font-medium text-slate-500">No rooms found.</p>
          <p className="mt-1 text-sm text-slate-400">
            {search || activeTag ? "Try adjusting your search or filter." : "Be the first to share a room to the community!"}
          </p>
        </div>
      )}

      {/* Cards */}
      {!loading && rooms.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="mb-3">
                <h2 className="text-base font-semibold text-slate-900 leading-snug line-clamp-1">{room.title}</h2>
                <p className="mt-0.5 text-xs text-slate-400">by {room.sellerName}</p>
              </div>

              {room.description && (
                <p className="mb-3 text-sm text-slate-500 line-clamp-2">{room.description}</p>
              )}

              {room.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {room.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
                <span>{room.sectionCount} section{room.sectionCount !== 1 ? "s" : ""}</span>
                <span className="text-slate-200">·</span>
                <span>{room.assetCount} asset{room.assetCount !== 1 ? "s" : ""}</span>
                <span className="text-slate-200">·</span>
                <span>{room.cloneCount} clone{room.cloneCount !== 1 ? "s" : ""}</span>
              </div>

              <div className="mt-auto pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleClone(room.id)}
                  disabled={cloningId === room.id}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cloningId === room.id ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Cloning…
                    </>
                  ) : "Use as Template"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

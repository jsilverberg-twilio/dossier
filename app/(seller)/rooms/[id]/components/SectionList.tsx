"use client";

import { useState } from "react";
import { useRoom } from "../context";
import { AssetPicker } from "./AssetPicker";
import { getThumbGrad, getThumbLabel, getMetaText } from "@/lib/assets";

export function SectionList() {
  const { sections, setSections, reloadSections, roomId } = useRoom();
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [pickerSection, setPickerSection] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [deletingAsset, setDeletingAsset] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  async function renameSection(sectionId: string) {
    const trimmed = editingTitle.trim();
    setEditingSection(null);
    if (!trimmed) return;
    const prev = sections.find((s) => s.id === sectionId)?.title;
    if (trimmed === prev) return;
    setSections((s) => s.map((sec) => sec.id === sectionId ? { ...sec, title: trimmed } : sec));
    const res = await fetch(`/api/rooms/${roomId}/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (!res.ok && prev !== undefined) {
      // Rollback optimistic update on failure.
      setSections((s) => s.map((sec) => sec.id === sectionId ? { ...sec, title: prev } : sec));
    }
  }

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    setLoading((p) => ({ ...p, addSection: true }));
    const res = await fetch(`/api/rooms/${roomId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSectionTitle.trim() }),
    });
    if (res.ok) {
      setNewSectionTitle("");
      setAddingSection(false);
      await reloadSections();
    }
    setLoading((p) => ({ ...p, addSection: false }));
  }

  async function deleteSection(sectionId: string, title: string) {
    if (!confirm(`Delete section "${title}" and all its assets?`)) return;
    setLoading((p) => ({ ...p, [sectionId]: true }));
    await fetch(`/api/rooms/${roomId}/sections/${sectionId}`, { method: "DELETE" });
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    setLoading((p) => ({ ...p, [sectionId]: false }));
  }

  async function moveSection(sectionId: string, direction: "up" | "down") {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const reordered = [...sections];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const updated = reordered.map((s, i) => ({ ...s, order: i }));
    setSections(updated);
    await fetch(`/api/rooms/${roomId}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: updated.map((s) => ({ id: s.id, order: s.order })) }),
    });
  }

  async function deleteAsset(sectionId: string, assetId: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setDeletingAsset(assetId);
    await fetch(`/api/rooms/${roomId}/sections/${sectionId}/assets/${assetId}`, { method: "DELETE" });
    setDeletingAsset(null);
    await reloadSections();
  }

  if (sections.length === 0 && !addingSection) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center">
          <p className="text-sm font-medium text-slate-500">Add your first section to get started</p>
          <button
            onClick={() => setAddingSection(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition"
          >
            ＋ Add Section
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => (
        <div
          key={section.id}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          {/* Section header */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
            {/* Reorder arrows */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                onClick={() => moveSection(section.id, "up")}
                disabled={idx === 0}
                className="rounded p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-25 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => moveSection(section.id, "down")}
                disabled={idx === sections.length - 1}
                className="rounded p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-25 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {editingSection === section.id ? (
              <input
                autoFocus
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => renameSection(section.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); renameSection(section.id); }
                  if (e.key === "Escape") setEditingSection(null);
                }}
                className="flex-1 bg-white border border-red-300 rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            ) : (
              <button
                onClick={() => { setEditingSection(section.id); setEditingTitle(section.title); }}
                className="flex-1 text-left text-xs font-bold text-slate-700 truncate hover:text-slate-900 transition"
                title="Click to rename"
              >
                {section.title}
              </button>
            )}
            <span className="text-[10px] text-slate-400 font-medium shrink-0">{section.assets.length}</span>

            <button
              onClick={() => deleteSection(section.id, section.title)}
              disabled={loading[section.id]}
              className="shrink-0 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
              title="Delete section"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Asset rows */}
          <div className="px-3 py-2 space-y-1">
            {section.assets.length === 0 && (
              <p className="text-[11px] text-slate-400 italic py-1">No assets yet</p>
            )}
            {section.assets.map((asset) => {
              const thumbGrad = getThumbGrad(asset.type, asset.metadata);
              const thumbLabel = getThumbLabel(asset.type, asset.metadata);
              const meta = getMetaText(asset.type, asset.metadata);
              return (
                <div
                  key={asset.id}
                  className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition"
                >
                  <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${thumbGrad} flex items-center justify-center text-[9px] font-black text-white shrink-0`}>
                    {thumbLabel}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{asset.title}</p>
                    {meta && <p className="text-[10px] text-slate-400">{meta}</p>}
                  </div>
                  <button
                    onClick={() => deleteAsset(section.id, asset.id, asset.title)}
                    disabled={deletingAsset === asset.id}
                    className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
                    title="Delete asset"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => setPickerSection(section.id)}
              className="mt-1 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition"
            >
              ＋ Add asset
            </button>
          </div>
        </div>
      ))}

      {/* Add Section form / button */}
      {addingSection ? (
        <form onSubmit={addSection} className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-3 py-2.5 shadow-sm">
          <input
            autoFocus
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="Section title…"
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading.addSection || !newSectionTitle.trim()}
            className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition"
          >
            {loading.addSection ? "Adding…" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => { setAddingSection(false); setNewSectionTitle(""); }}
            className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:text-slate-700 transition"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAddingSection(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition"
        >
          ＋ Add Section
        </button>
      )}

      {pickerSection && (
        <AssetPicker
          roomId={roomId}
          sectionId={pickerSection}
          onClose={() => setPickerSection(null)}
          onSaved={reloadSections}
        />
      )}
    </div>
  );
}

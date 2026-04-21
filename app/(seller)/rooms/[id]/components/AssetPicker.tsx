"use client";

import { useState, useRef, useCallback } from "react";

type Tab = "file" | "resource" | "note" | "demo";
type ResourceSource = "url" | "twilio-docs";

interface AssetPickerProps {
  roomId: string;
  sectionId: string;
  onClose: () => void;
  onSaved: () => void;
}

type DocsResult = { title: string; url: string; category: string; description: string };

export function AssetPicker({ roomId, sectionId, onClose, onSaved }: AssetPickerProps) {
  const [tab, setTab] = useState<Tab>("file");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [resourceSource, setResourceSource] = useState<ResourceSource>("url");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");

  const [docsQuery, setDocsQuery] = useState("");
  const [docsResults, setDocsResults] = useState<DocsResult[]>([]);
  const [docsSelected, setDocsSelected] = useState<DocsResult | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const docsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      if (!fileTitle) setFileTitle(dropped.name.replace(/\.[^.]+$/, ""));
    }
  }, [fileTitle]);

  const handleDocsSearch = useCallback((q: string) => {
    setDocsQuery(q);
    setDocsError(null);
    if (docsDebounceRef.current) clearTimeout(docsDebounceRef.current);
    if (!q.trim()) { setDocsResults([]); return; }
    docsDebounceRef.current = setTimeout(async () => {
      setDocsLoading(true);
      try {
        const res = await fetch(`/api/docs/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Search unavailable");
        setDocsResults(await res.json());
      } catch {
        setDocsError("Search unavailable — try again");
        setDocsResults([]);
      } finally {
        setDocsLoading(false);
      }
    }, 300);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const fd = new FormData();
      if (tab === "file") {
        if (!file) throw new Error("Please select a file.");
        if (!fileTitle.trim()) throw new Error("Please enter a title.");
        fd.append("type", "file");
        fd.append("title", fileTitle.trim());
        fd.append("description", fileDescription.trim());
        fd.append("file", file);
      } else if (tab === "note") {
        if (!noteTitle.trim()) throw new Error("Please enter a title.");
        fd.append("type", "richtext");
        fd.append("title", noteTitle.trim());
        fd.append("content", noteContent.trim());
      } else if (tab === "resource") {
        if (resourceSource === "url") {
          if (!resourceUrl.trim()) throw new Error("Please enter a URL.");
          if (!resourceTitle.trim()) throw new Error("Please enter a title.");
          fd.append("type", "link");
          fd.append("sourceType", "manual");
          fd.append("title", resourceTitle.trim());
          fd.append("description", resourceDescription.trim());
          fd.append("url", resourceUrl.trim());
        } else {
          if (!docsSelected) throw new Error("Please select a document.");
          fd.append("type", "link");
          fd.append("sourceType", "twilio-docs");
          fd.append("title", docsSelected.title);
          fd.append("description", docsSelected.description ?? "");
          fd.append("url", docsSelected.url);
        }
      }
      const res = await fetch(`/api/rooms/${roomId}/sections/${sectionId}/assets`, { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save asset");
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string; disabled?: boolean }[] = [
    { id: "file", label: "Upload File" },
    { id: "resource", label: "Add Resource" },
    { id: "note", label: "Write Note" },
    { id: "demo", label: "Live Demo", disabled: true },
  ];

  const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition";
  const showSave = tab !== "demo" && !(tab === "resource" && resourceSource === "twilio-docs" && !docsSelected);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h2 className="text-sm font-bold text-slate-900">Add Asset</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-0 border-b border-slate-100 px-5 shrink-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => !t.disabled && setTab(t.id)}
              disabled={t.disabled}
              className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition
                ${t.disabled
                  ? "cursor-not-allowed text-slate-300"
                  : tab === t.id
                  ? "text-red-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-500"
                  : "text-slate-400 hover:text-slate-700"
                }`}
            >
              {t.label}
              {t.disabled && (
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">Soon</span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <form id="asset-form" onSubmit={handleSubmit}>

            {/* Upload File Tab */}
            {tab === "file" && (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition
                    ${dragOver ? "border-red-400 bg-red-50"
                      : file ? "border-green-300 bg-green-50"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                >
                  {file ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-green-500 mb-2">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-green-700 text-center truncate max-w-xs">{file.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB — click to replace</p>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-slate-400 mb-2">
                        <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                      </svg>
                      <p className="text-sm font-medium text-slate-600">Drop a file or click to browse</p>
                      <p className="mt-1 text-xs text-slate-400">PDF, PPTX, DOCX, images, videos, and more</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); if (!fileTitle) setFileTitle(f.name.replace(/\.[^.]+$/, "")); }
                }} />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} placeholder="e.g. Product Overview Deck" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Description <span className="font-normal text-slate-400 normal-case">(optional)</span></label>
                  <textarea rows={2} value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} placeholder="Short description for the customer" className={`${inputCls} resize-none`} />
                </div>
              </div>
            )}

            {/* Add Resource Tab */}
            {tab === "resource" && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Source</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["url", "twilio-docs"] as ResourceSource[]).map((src) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => { setResourceSource(src); setDocsSelected(null); }}
                        className={`rounded-xl border px-4 py-3 text-left transition
                          ${resourceSource === src
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{src === "url" ? "🔗 Any URL" : "📄 Twilio Docs"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{src === "url" ? "Paste a link" : "Search library"}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {resourceSource === "url" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">URL <span className="text-red-500">*</span></label>
                      <input type="url" required value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://example.com" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Title <span className="text-red-500">*</span></label>
                      <input type="text" required value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} placeholder="e.g. Pricing Page" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Description <span className="font-normal text-slate-400 normal-case">(optional)</span></label>
                      <textarea rows={2} value={resourceDescription} onChange={(e) => setResourceDescription(e.target.value)} placeholder="What will the customer find here?" className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                )}
                {resourceSource === "twilio-docs" && (
                  <div className="space-y-2">
                    <input type="text" value={docsQuery} onChange={(e) => handleDocsSearch(e.target.value)} placeholder="Search Twilio docs…" className={inputCls} />
                    {!docsQuery.trim() && <p className="text-xs text-slate-400 px-1">Start typing to search…</p>}
                    {docsLoading && <p className="text-xs text-slate-400 px-1">Searching…</p>}
                    {docsError && <p className="text-xs text-red-500 px-1">{docsError}</p>}
                    {!docsLoading && !docsError && docsResults.length > 0 && (
                      <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                        {docsResults.map((r, i) => (
                          <button key={i} type="button" onClick={() => setDocsSelected(r)}
                            className={`w-full text-left px-3 py-2.5 text-sm transition ${docsSelected?.url === r.url ? "bg-red-50 border-l-2 border-red-400" : "hover:bg-slate-50"}`}>
                            <p className="font-medium text-slate-900 truncate">{r.title}</p>
                            <p className="text-xs text-slate-400 truncate">{r.url.replace("https://www.twilio.com/docs", "/docs")}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {!docsLoading && !docsError && docsQuery.trim() && docsResults.length === 0 && (
                      <p className="text-xs text-slate-400 px-1">No results found.</p>
                    )}
                    {docsSelected && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                        <p className="text-xs text-red-400 mb-0.5">Selected</p>
                        <p className="text-sm font-medium text-slate-900">{docsSelected.title}</p>
                        <p className="text-xs text-slate-400 truncate">{docsSelected.url.replace("https://www.twilio.com/docs", "/docs")}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Write Note Tab */}
            {tab === "note" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="e.g. Welcome Message" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Content</label>
                  <textarea rows={6} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write your note here…" className={`${inputCls} resize-none`} />
                </div>
              </div>
            )}

            {tab === "demo" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm font-medium text-slate-400">Coming Soon</p>
                <p className="mt-1 text-xs text-slate-400">This feature is under development.</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-4 shrink-0 flex items-center justify-between gap-3">
          {error && <p className="text-sm text-red-500 flex-1 truncate">{error}</p>}
          {!error && <div className="flex-1" />}
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700">
              Cancel
            </button>
            {showSave && (
              <button type="submit" form="asset-form" disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50">
                {saving ? "Saving…" : "Save Asset"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

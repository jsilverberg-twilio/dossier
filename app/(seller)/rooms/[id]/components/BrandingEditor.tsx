"use client";

import { useRef, useState } from "react";

interface BrandingData {
  sellerLogoUrl?: string;
  customerLogoUrl?: string;
  primaryColor?: string;
  companyName?: string;
}

interface Props {
  roomId: string;
  initialBranding: BrandingData;
}

export function BrandingEditor({ roomId, initialBranding }: Props) {
  const [branding, setBranding] = useState<BrandingData>(initialBranding);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sellerFileRef = useRef<HTMLInputElement>(null);
  const customerFileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const sellerFile = sellerFileRef.current?.files?.[0];
    const customerFile = customerFileRef.current?.files?.[0];

    const formData = new FormData();
    if (sellerFile) formData.append("sellerLogo", sellerFile);
    if (customerFile) formData.append("customerLogo", customerFile);
    if (branding.primaryColor) formData.append("primaryColor", branding.primaryColor);
    if (branding.companyName !== undefined) formData.append("companyName", branding.companyName ?? "");

    try {
      const res = await fetch(`/api/rooms/${roomId}/branding`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Save failed");
      }
      const updated: BrandingData = await res.json();
      setBranding(updated);
      if (sellerFileRef.current) sellerFileRef.current.value = "";
      if (customerFileRef.current) customerFileRef.current.value = "";
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 px-4 py-5">
      {/* Logo row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Seller logo */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Seller Logo
          </label>
          {branding.sellerLogoUrl && (
            <div className="mb-2 rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-center h-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.sellerLogoUrl}
                alt="Seller logo"
                className="max-h-10 max-w-full object-contain"
              />
            </div>
          )}
          {!branding.sellerLogoUrl && (
            <div className="mb-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 flex items-center justify-center h-16">
              <span className="text-xs text-amber-500 font-semibold">⚠ Missing</span>
            </div>
          )}
          <input
            ref={sellerFileRef}
            type="file"
            accept="image/*"
            className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1 file:text-xs file:font-medium file:text-slate-600 file:shadow-sm file:transition hover:file:border-slate-300 cursor-pointer"
          />
        </div>

        {/* Customer logo */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Customer Logo
          </label>
          {branding.customerLogoUrl && (
            <div className="mb-2 rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-center h-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.customerLogoUrl}
                alt="Customer logo"
                className="max-h-10 max-w-full object-contain"
              />
            </div>
          )}
          {!branding.customerLogoUrl && (
            <div className="mb-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 flex items-center justify-center h-16">
              <span className="text-xs text-amber-500 font-semibold">⚠ Missing</span>
            </div>
          )}
          <input
            ref={customerFileRef}
            type="file"
            accept="image/*"
            className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1 file:text-xs file:font-medium file:text-slate-600 file:shadow-sm file:transition hover:file:border-slate-300 cursor-pointer"
          />
        </div>
      </div>

      {/* Color + company name row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Accent color */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Accent Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={branding.primaryColor ?? "#ef4444"}
              onChange={(e) =>
                setBranding((prev) => ({ ...prev, primaryColor: e.target.value }))
              }
              className="h-8 w-10 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-0.5"
            />
            <input
              type="text"
              value={branding.primaryColor ?? "#ef4444"}
              onChange={(e) =>
                setBranding((prev) => ({ ...prev, primaryColor: e.target.value }))
              }
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="#ef4444"
              maxLength={9}
            />
          </div>
        </div>

        {/* Company name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Company Name
          </label>
          <input
            type="text"
            value={branding.companyName ?? ""}
            onChange={(e) =>
              setBranding((prev) => ({ ...prev, companyName: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="Twilio"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {saving ? "Saving…" : "Save Branding"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </div>
  );
}

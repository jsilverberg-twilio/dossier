import { getCurrentUser } from "@/lib/current-user";
import Link from "next/link";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const initials = user.name
    ? user.name
        .split(" ")
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "S";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-50 h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
        {/* Left */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 pr-5 border-r border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white text-sm font-black">
              D
            </div>
            <span className="text-sm font-bold text-slate-900">Dossier</span>
          </div>
          <nav className="pl-5">
            <Link
              href="/dashboard"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white select-none">
            {initials}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}

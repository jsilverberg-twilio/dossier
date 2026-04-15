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
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 flex items-center justify-between h-14 shrink-0">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-white tracking-tight"
          >
            Digital Asset Rooms
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/community"
              className="rounded-md px-3 py-1.5 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
            >
              Community
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* User avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white select-none">
            {initials}
          </div>
          <span className="text-sm text-gray-300 hidden sm:block">
            {user?.name}
          </span>

        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}

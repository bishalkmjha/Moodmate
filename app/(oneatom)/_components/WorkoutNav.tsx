"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/reels", label: "Reels" },
  { href: "/library", label: "Library" },
  { href: "/habits", label: "Habits" },
  { href: "/progress", label: "Progress" },
  { href: "/profile", label: "Profile" },
];

export function WorkoutNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Workout"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl px-4 pb-5"
    >
      <div className="workout-card flex items-center justify-between gap-1 rounded-2xl px-2 py-2">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 items-center justify-center rounded-xl px-2 py-2 text-xs transition-colors sm:text-sm ${
                active
                  ? "bg-amber-500 font-semibold text-slate-950"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

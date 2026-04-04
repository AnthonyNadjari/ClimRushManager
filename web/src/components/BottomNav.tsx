"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/machines", label: "Machines", icon: BoxIcon },
  { href: "/planning", label: "Planning", icon: CalIcon },
  { href: "/livraisons", label: "Livraisons", icon: TruckIcon },
  { href: "/plus", label: "Plus", icon: MoreIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md print:hidden lg:hidden"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-lg justify-around px-1 pt-1 sm:max-w-none">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/" || pathname === ""
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-medium transition-colors ${
                active
                  ? "text-[var(--cr-blue)]"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Icon active={active} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--cr-blue)" : "currentColor"}
      strokeWidth={2}
      className="shrink-0"
    >
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" />
    </svg>
  );
}

function BoxIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--cr-blue)" : "currentColor"}
      strokeWidth={2}
      className="shrink-0"
    >
      <path d="M21 8l-9 4-9-4 9-4 9 4zM3 8v8l9 4 9-4V8" />
    </svg>
  );
}

function CalIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--cr-blue)" : "currentColor"}
      strokeWidth={2}
      className="shrink-0"
    >
      <rect x={3} y={4} width={18} height={18} rx={2} />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function TruckIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--cr-blue)" : "currentColor"}
      strokeWidth={2}
      className="shrink-0"
    >
      <path d="M14 18V6H3v12h2.5M14 18h2.5M14 18v-4h6l3 4v2h-2.5M9 18h5" />
      <circle cx={7.5} cy={18.5} r={1.5} />
      <circle cx={17.5} cy={18.5} r={1.5} />
    </svg>
  );
}

function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--cr-blue)" : "currentColor"}
      strokeWidth={2}
      className="shrink-0"
    >
      <circle cx={5} cy={12} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={12} cy={12} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={19} cy={12} r={1.5} fill="currentColor" stroke="none" />
    </svg>
  );
}

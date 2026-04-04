"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primary = [
  { href: "/", label: "Accueil" },
  { href: "/machines", label: "Machines" },
  { href: "/planning", label: "Planning" },
  { href: "/livraisons", label: "Livraisons" },
] as const;

const secondary = [
  { href: "/reprises", label: "Reprises" },
  { href: "/clients", label: "Clients" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/analytics", label: "Analytics" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-zinc-200/80 bg-white shadow-sm lg:flex print:hidden"
      aria-label="Navigation bureau"
    >
      <div className="border-b border-zinc-100 px-5 py-5">
        <p className="font-serif text-xl font-bold tracking-tight text-zinc-900">
          ClimRush
        </p>
        <p className="text-xs text-zinc-500">Gestion opérationnelle</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Menu
        </p>
        {primary.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-[var(--cr-blue)]"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {label}
            </Link>
          );
        })}

        <p className="mb-1 mt-5 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Plus
        </p>
        {secondary.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-[var(--cr-blue)]"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

import Link from "next/link";

const links = [
  {
    href: "/reprises",
    title: "Reprises",
    desc: "Terrain — scan, photos, validation",
    color: "from-amber-500 to-orange-600",
  },
  {
    href: "/clients",
    title: "Clients",
    desc: "Base, filtres, export CSV",
    color: "from-blue-500 to-indigo-600",
  },
  {
    href: "/maintenance",
    title: "Maintenance",
    desc: "SAV après retour — validation stock",
    color: "from-red-500 to-rose-600",
  },
  {
    href: "/analytics",
    title: "Analytics",
    desc: "CA, occupation, objectifs",
    color: "from-violet-500 to-purple-700",
  },
] as const;

export default function PlusPage() {
  return (
    <div className="flex flex-1 flex-col px-4 pb-2">
      <header className="pt-3">
        <h1 className="font-serif text-2xl font-bold text-zinc-900">Plus</h1>
        <p className="text-sm text-zinc-500">
          Accès rapide — livraisons restent dans la barre du bas
        </p>
      </header>

      <ul className="mt-5 flex flex-col gap-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`flex min-h-[72px] items-center rounded-2xl bg-gradient-to-br ${l.color} px-5 py-4 text-white shadow-md active:scale-[0.99]`}
            >
              <div>
                <p className="font-serif text-xl font-bold">{l.title}</p>
                <p className="text-sm text-white/90">{l.desc}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-6 rounded-2xl border border-zinc-100 bg-white p-4 text-sm text-zinc-700 shadow-sm">
        <h2 className="font-semibold text-zinc-900">SMS automatiques (V1.1)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>
            <strong>J-7</strong> — rachat valeur résiduelle (Twilio / Brevo)
          </li>
          <li>
            <strong>J-5</strong> — extension avec discount fidélité
          </li>
          <li>
            <strong>J-0</strong> — livraison / reprise planifiée
          </li>
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          Phase 1 : intégrations à brancher — cette app est une UI prête pour
          API.
        </p>
      </section>
    </div>
  );
}

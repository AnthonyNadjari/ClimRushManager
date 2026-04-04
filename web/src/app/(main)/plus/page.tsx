import Link from "next/link";

const links = [
  {
    href: "/machines",
    title: "Inventaire",
    desc: "Parc par n° d’unité, statuts et lots",
    color: "from-slate-600 to-zinc-800",
  },
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
    <div className="flex flex-1 flex-col pb-2">
      <header className="pt-3 lg:pt-0">
        <h1 className="font-serif text-2xl font-bold text-zinc-900 lg:text-3xl">
          Plus
        </h1>
        <p className="text-sm text-zinc-500 lg:text-base">
          Accès rapide — sur téléphone, utilisez la barre du bas ; sur ordinateur,
          le menu à gauche.
        </p>
      </header>

      <ul className="mt-5 flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
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
        <h2 className="font-semibold text-zinc-900">SMS (V1.1)</h2>
        <p className="mt-2 text-zinc-600">
          Aujourd’hui : boutons <strong>SMS (brouillon)</strong> qui ouvrent
          l’app Messages du téléphone avec un texte prérempli — vous validez
          l’envoi à la main. Pas de service « gratuit » fiable pour envoyer des
          SMS en masse sans API ; en production, prévoir un fournisseur
          (Twilio, Vonage, Brevo SMS, etc.) pour les rappels automatiques.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-4">
          <li>
            <strong>J-7</strong> — rachat valeur résiduelle (à automatiser via
            API)
          </li>
          <li>
            <strong>J-5</strong> — extension avec discount fidélité
          </li>
          <li>
            <strong>J-0</strong> — livraison / reprise planifiée
          </li>
        </ul>
      </section>
    </div>
  );
}

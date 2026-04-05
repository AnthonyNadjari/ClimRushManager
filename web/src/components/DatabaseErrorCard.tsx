type Props = { heading?: string };

export function DatabaseErrorCard({
  heading = "Base de données inaccessible",
}: Props) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-semibold">{heading}</p>
      <p className="mt-1">
        En <strong>local</strong> : créez{" "}
        <code className="rounded bg-white/80 px-1">web/.env.local</code> avec{" "}
        <code className="rounded bg-white/80 px-1">DATABASE_URL</code> (voir{" "}
        <code className="rounded bg-white/80 px-1">web/.env.local.example</code>{" "}
        et le README — <code className="rounded bg-white/80 px-1">vercel env pull</code>{" "}
        laisse souvent <code className="rounded bg-white/80 px-1">DATABASE_URL</code>{" "}
        vide si la variable est « Sensitive » sur Vercel). Puis{" "}
        <code className="rounded bg-white/80 px-1">npx prisma migrate deploy</code>{" "}
        et{" "}
        <code className="rounded bg-white/80 px-1">npx prisma db seed</code> si besoin.
      </p>
      <p className="mt-2 text-red-800/90">
        En <strong>production</strong> : vérifiez que{" "}
        <code className="rounded bg-white/80 px-1">DATABASE_URL</code> est bien définie
        sur le projet Vercel, puis redéployez.
      </p>
    </div>
  );
}

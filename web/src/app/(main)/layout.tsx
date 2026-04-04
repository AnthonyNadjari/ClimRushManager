import { AppShell } from "@/components/AppShell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-zinc-300/40 md:bg-zinc-200">
      <AppShell>{children}</AppShell>
    </div>
  );
}

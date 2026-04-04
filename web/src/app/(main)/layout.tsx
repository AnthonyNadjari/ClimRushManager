import { AppShell } from "@/components/AppShell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-zinc-300/40 lg:bg-transparent">
      <AppShell>{children}</AppShell>
    </div>
  );
}

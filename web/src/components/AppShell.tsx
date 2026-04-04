import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[var(--cr-bg)] shadow-xl shadow-zinc-200/50 md:my-4 md:min-h-[calc(100dvh-2rem)] md:rounded-3xl md:ring-1 md:ring-zinc-200">
      <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

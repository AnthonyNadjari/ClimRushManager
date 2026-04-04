import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full bg-[var(--cr-bg)] lg:bg-zinc-100">
      <DesktopSidebar />

      {/* Mobile : colonne type téléphone. Bureau : pleine largeur à droite de la sidebar. */}
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col lg:ml-56 lg:max-w-none lg:shadow-none print:ml-0 print:max-w-none">
        <main className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] print:pb-4 lg:px-8 lg:pb-8 lg:pt-6">
          <div className="flex flex-1 flex-col px-4 lg:mx-auto lg:w-full lg:max-w-6xl lg:px-0">
            {children}
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

import { AppHeader } from "@/components/layout/AppHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ambient-bg min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-7 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}

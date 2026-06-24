import { AppHeader } from "@/components/layout/AppHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ambient-bg min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

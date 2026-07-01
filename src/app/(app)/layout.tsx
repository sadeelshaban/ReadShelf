import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooterGate } from "@/components/layout/AppFooterGate";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ambient-bg min-h-screen">
      <AppHeader />
      <main className="w-full px-4 py-7 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      <AppFooterGate />
    </div>
  );
}

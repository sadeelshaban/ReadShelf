import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooterGate } from "@/components/layout/AppFooterGate";
import { AppMain } from "@/components/layout/AppMain";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ambient-bg min-h-screen">
      <AppHeader />
      <AppMain>{children}</AppMain>
      <AppFooterGate />
    </div>
  );
}

import { AppHeader } from "@/components/layout/AppHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ambient-bg min-h-screen">
      <AppHeader />
      <main className="w-full px-4 py-7 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      <div className="w-full px-4 pb-4 pt-2 sm:px-6 lg:px-8">
        <SiteFooter compact />
      </div>
    </div>
  );
}

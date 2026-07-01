import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { OfflineSyncRegister } from "@/components/offline/OfflineSyncRegister";
import { PresenceHeartbeat } from "@/components/presence/PresenceHeartbeat";
import { SetupBanner } from "@/components/layout/SetupBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ReadShelf",
    template: "%s",
  },
  description:
    "A personal digital shelf that saves books, reading progress, highlights, and notes.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: "/favicon.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "ReadShelf",
    description:
      "A personal digital shelf that saves books, reading progress, highlights, and notes.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "ReadShelf" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#7B4B2A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <SetupBanner />
        {children}
        <PresenceHeartbeat />
        <OfflineSyncRegister />
      </body>
    </html>
  );
}

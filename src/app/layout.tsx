import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "RecheManage Web",
  description: "브라우저에서 Excel/CSV 거래내역을 분석합니다.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "RecheManage Web",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

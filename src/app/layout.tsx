import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { TabOpenNotice } from "@/components/TabOpenNotice";
import { AlarmRingingDialog } from "@/components/AlarmRingingDialog";
import { STORAGE_KEYS } from "@/lib/keys";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "作業タイマー",
  description: "ポモドーロタイマーとアラームで作業時間を管理するWebアプリ",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#141311" },
  ],
};

// 保存済みのテーマを描画前に適用して、ちらつきを防ぐ
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEYS.settings,
)})||"{}");var t=s.theme||"system";if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <Header />
          <TabOpenNotice />
          <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-28 sm:pb-12">
            {children}
          </main>
          <AlarmRingingDialog />
        </Providers>
      </body>
    </html>
  );
}

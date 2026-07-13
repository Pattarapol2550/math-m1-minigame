import type { Metadata } from "next";
import { Press_Start_2P, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const thaiFont = Noto_Sans_Thai({
  weight: ["400", "500", "700"],
  subsets: ["thai"],
  variable: "--font-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Math Quest — เกมคณิตศาสตร์ ม.1",
  description: "เรียนคณิตศาสตร์ผ่านการผจญภัย",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${pixelFont.variable} ${thaiFont.variable} font-thai bg-slate-900 min-h-screen`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

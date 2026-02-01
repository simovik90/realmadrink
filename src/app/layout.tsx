import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RealMadrink – Squadre Calcetto",
  description: "Crea le tue squadre di calcetto in un tap",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RealMadrink" },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d3b2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-body antialiased text-sport-white min-h-dvh safe-top safe-bottom">
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit, Inter } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
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
  icons: { apple: "/icon-192.png" },
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
    <html lang="it" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased text-sport-white min-h-dvh safe-top safe-bottom">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("realmadrink_theme");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}`,
          }}
        />
        <PwaRegister />
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <LanguageToggle />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


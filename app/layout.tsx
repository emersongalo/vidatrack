import type { Metadata, Viewport } from "next";
import { Outfit, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { RegistradorPWA } from "@/components/RegistradorPWA";
import { RegistradorPushNativo } from "@/components/RegistradorPushNativo";
import { GerenciadorSincronizacaoOffline } from "@/components/GerenciadorSincronizacaoOffline";
import { BaixadorOfflineAutomatico } from "@/components/BaixadorOfflineAutomatico";
import { AnalyticsAnonimo } from "@/components/AnalyticsAnonimo";
import { PromptInstalarApp } from "@/components/PromptInstalarApp";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "VidaTrack — Hábitos, Notas e Finanças",
  description:
    "Um único lugar para acompanhar seus hábitos, organizar suas notas e controlar suas finanças.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VidaTrack",
  },
};

// Trava o "pinça pra dar zoom" acidental, que estava desalinhando o
// layout no celular quando encostava sem querer na tela.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F1013",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        {/* Aplica o tema salvo antes da 1ª pintura, evitando flash de tela errada */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.setAttribute('data-theme', localStorage.getItem('vidatrack-tema') || 'dark')}catch(e){}`,
          }}
        />
        {children}
        <RegistradorPWA />
        <RegistradorPushNativo />
        <GerenciadorSincronizacaoOffline />
        <BaixadorOfflineAutomatico />
        <AnalyticsAnonimo />
        <PromptInstalarApp />
      </body>
    </html>
  );
}

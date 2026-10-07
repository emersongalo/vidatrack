import type { Metadata, Viewport } from "next";
import { Outfit, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { RegistradorPWA } from "@/components/RegistradorPWA";
import { RecuperadorDeSegundoPlano } from "@/components/RecuperadorDeSegundoPlano";
import { RegistradorPushNativo } from "@/components/RegistradorPushNativo";
import { GerenciadorSincronizacaoOffline } from "@/components/GerenciadorSincronizacaoOffline";
import { BaixadorOfflineAutomatico } from "@/components/BaixadorOfflineAutomatico";
import { AnalyticsAnonimo } from "@/components/AnalyticsAnonimo";
import { PromptInstalarApp } from "@/components/PromptInstalarApp";
import { AlarmeAlertaTela } from "@/components/AlarmeAlertaTela";
import { SincronizadorWidgets } from "@/components/SincronizadorWidgets";
import { ErrosGlobais } from "@/components/ErrosGlobais";
import { BloqueioApp } from "@/components/BloqueioApp";
import { RegistrarIndicacao } from "@/components/RegistrarIndicacao";
import { CorBarraPorRota } from "@/components/CorBarraPorRota";
import { AvisoAtualizacaoApp } from "@/components/AvisoAtualizacaoApp";
import { IndicadorConexao } from "@/components/IndicadorConexao";
import { BotaoVoltarApp } from "@/components/BotaoVoltarApp";
import { AvisoConvites } from "@/components/AvisoConvites";
import { SCRIPT_PRE_BLOQUEIO } from "@/lib/seguranca/pin";
import { SCRIPT_APARENCIA } from "@/lib/preferencias/aparencia";
import { CSS_ABERTURA, HTML_ABERTURA, SCRIPT_ABERTURA } from "@/lib/app/abertura";

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
  title: "VidaTrack — Hábitos e Finanças",
  description:
    "Um único lugar para acompanhar seus hábitos e controlar suas finanças.",
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
        {/* Etapa 214 — se o PIN estiver ativo, esconde a tela até desbloquear */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html[data-bloqueado] body > :not(#bloqueio-app):not(script):not(style){visibility:hidden}`,
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_PRE_BLOQUEIO }} />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_APARENCIA }} />
        {/* Etapa 263 — abertura com o logo animado (1x por sessão, antes do React carregar) */}
        <style dangerouslySetInnerHTML={{ __html: CSS_ABERTURA }} />
        <div id="vt-abertura" aria-hidden="true" dangerouslySetInnerHTML={{ __html: HTML_ABERTURA }} />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ABERTURA }} />
        {/* Etapa 240 — barra de status volta à cor normal fora das telas coloridas */}
        <CorBarraPorRota />
        {/* Etapa 241 — versão nova do app na Play Store */}
        <AvisoAtualizacaoApp />
        {children}
        <RegistradorPWA />
        <RecuperadorDeSegundoPlano />
        <RegistradorPushNativo />
        <GerenciadorSincronizacaoOffline />
        <BaixadorOfflineAutomatico />
        <AnalyticsAnonimo />
        <PromptInstalarApp />
        <AlarmeAlertaTela />
        <SincronizadorWidgets />
        <ErrosGlobais />
        {/* Etapa 261 — aviso animado de sem internet / conectou de novo */}
        <IndicadorConexao />
        {/* Etapa 266 — botão voltar do Android em todas as telas */}
        <BotaoVoltarApp />
        <AvisoConvites />
        <BloqueioApp />
        <RegistrarIndicacao />
      </body>
    </html>
  );
}

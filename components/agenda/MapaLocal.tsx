"use client";

// Etapa 357 — local do compromisso no mapa: mapinha dentro do app (com
// internet) + botões pra abrir no Google Maps / Waze / traçar rota.
import { useEffect, useState } from "react";
import { MapPin, Navigation, ExternalLink } from "lucide-react";
import { urlGoogleMaps, urlMapaEmbutido, urlRota, urlWaze } from "@/lib/agenda/visual";

export function MapaLocal({ local, compacto = false }: { local: string; compacto?: boolean }) {
  const [online, setOnline] = useState(true);
  const [carregou, setCarregou] = useState(false);
  useEffect(() => {
    const at = () => setOnline(navigator.onLine !== false);
    at();
    window.addEventListener("online", at);
    window.addEventListener("offline", at);
    return () => {
      window.removeEventListener("online", at);
      window.removeEventListener("offline", at);
    };
  }, []);
  if (!local.trim()) return null;
  const botao = "flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-base-600 bg-base-900/60 py-2 text-xs font-medium hover:border-ink-400";
  return (
    <div className="rounded-2xl border border-base-600 overflow-hidden bg-base-900/40">
      {online ? (
        <div className={`relative ${compacto ? "h-32" : "h-44"} bg-base-700`}>
          {!carregou && (
            <div className="absolute inset-0 flex items-center justify-center text-ink-400 text-xs gap-1.5 animate-pulse">
              <MapPin size={14} /> carregando mapa…
            </div>
          )}
          <iframe
            title={`Mapa: ${local}`}
            src={urlMapaEmbutido(local)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setCarregou(true)}
            className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-500 ${carregou ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      ) : (
        <p className="px-3 pt-3 text-xs text-ink-400">📴 O mapa aparece quando tiver internet.</p>
      )}
      <div className="flex gap-1.5 p-2">
        <a href={urlRota(local)} target="_blank" rel="noopener noreferrer" className={botao}>
          <Navigation size={13} /> Rota
        </a>
        <a href={urlGoogleMaps(local)} target="_blank" rel="noopener noreferrer" className={botao}>
          <ExternalLink size={13} /> Maps
        </a>
        <a href={urlWaze(local)} target="_blank" rel="noopener noreferrer" className={botao}>
          🚙 Waze
        </a>
      </div>
    </div>
  );
}

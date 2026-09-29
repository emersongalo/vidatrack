"use client";

// Etapa 221 — "🏅 Nova conquista!" no Painel quando um selo é desbloqueado.
import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { CHAVE_CONQUISTAS_VISTAS, calcularConquistas, conquistasNovas, type Conquista } from "@/lib/habitos/conquistas";

export function AvisoConquista() {
  const { snapshot } = useSnapshotOffline();
  const [novas, setNovas] = useState<Conquista[]>([]);
  const [vistas, setVistas] = useState<string[]>([]);

  useEffect(() => {
    if (!snapshot) return;
    try {
      const r = conquistasNovas(calcularConquistas(snapshot, hojeISO()), localStorage.getItem(CHAVE_CONQUISTAS_VISTAS));
      if (r.novas.length) {
        setNovas(r.novas);
        setVistas(r.vistas);
      } else {
        localStorage.setItem(CHAVE_CONQUISTAS_VISTAS, JSON.stringify(r.vistas));
      }
    } catch {
      /* sem localStorage: sem aviso */
    }
  }, [snapshot]);

  if (!novas.length) return null;

  function marcarVistas() {
    try {
      localStorage.setItem(CHAVE_CONQUISTAS_VISTAS, JSON.stringify(vistas));
    } catch {
      /* ignora */
    }
    setNovas([]);
  }

  const primeira = novas[0];
  return (
    <div className="flex items-center gap-3 mt-3 mb-1 rounded-xl2 p-4 border border-habito/50 bg-habito/10">
      <Link href="/habitos/conquistas" onClick={marcarVistas} className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-3xl">{primeira.emoji}</span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            Nova conquista{novas.length > 1 ? `s (${novas.length})` : ""}: {primeira.titulo}
          </span>
          <span className="block text-xs text-ink-400 truncate">{primeira.texto}</span>
        </span>
      </Link>
      <button aria-label="Fechar" onClick={marcarVistas} className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100">
        <X size={16} />
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, Copy, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Etapa 218 — convidar amigos com um link pessoal
const SITE = "https://www.vidatrack.online";

export default function ConvidarPage() {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [indicados, setIndicados] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // Etapa 276 — recompensa: quantos já usam de verdade
  const [ativos, setAtivos] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("meu_codigo_convite").then(({ data, error }) => {
      if (error || !data) setErro("Precisa de internet pra gerar seu link.");
      else setCodigo(String(data));
    });
    supabase.rpc("contar_indicados").then(({ data }) => setIndicados(typeof data === "number" ? data : 0));
    fetch("/api/indicacoes")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAtivos(Number(d.ativos) || 0))
      .catch(() => {});
  }, []);

  const link = codigo ? `${SITE}/apresentacao?ref=${codigo}` : "";
  const mensagem = `Tô usando o VidaTrack pra organizar hábitos, tarefas e dinheiro num app só — e é grátis. Experimenta: ${link}`;

  async function compartilhar() {
    setAviso(null);
    try {
      if (navigator.share) return await navigator.share({ text: mensagem });
    } catch {
      return;
    }
    copiar();
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem);
      setAviso("Copiado! É só colar no WhatsApp ou onde quiser.");
    } catch {
      setAviso("Não consegui copiar — segure no link abaixo pra copiar.");
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-curta">
      <Link href="/perfil" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Perfil
      </Link>
      <div className="mt-4 mb-6 rounded-xl2 p-6 bg-gradient-to-br from-habito/20 to-financa/20 border border-base-600 text-center">
        <p className="text-4xl mb-2">🎁</p>
        <h1 className="text-3xl font-display font-bold mb-1">Convide seus amigos</h1>
        <p className="text-sm text-ink-400">Ajude o VidaTrack a crescer — ele continua de graça e fica melhor com mais gente usando.</p>
      </div>

      {/* Etapa 276 — recompensa */}
      <div className="mb-6 rounded-2xl border border-nota/40 bg-nota/10 p-4">
        <p className="text-sm font-semibold">🎨 Ganhe cores novas pro app</p>
        <p className="text-xs text-ink-400 mt-1">
          Quando 1 pessoa que entrou pelo seu link usar o VidaTrack por uma semana, você libera os temas Oceano 🌊, Floresta 🌲 e
          Ameixa 🍇 (em Perfil → Aparência).
        </p>
        {ativos !== null && (
          <p className={`text-sm mt-2 font-medium ${ativos > 0 ? "text-habito" : "text-ink-400"}`}>
            {ativos > 0 ? "✅ Liberado! Escolha em Perfil → Aparência." : "⏳ Ainda não — compartilhe seu link abaixo."}
          </p>
        )}
      </div>

      {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}

      {codigo && (
        <>
          <p className="text-sm text-ink-400 mb-1">Seu link</p>
          <p className="font-mono text-sm bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 break-all select-all mb-3">{link}</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button type="button" onClick={compartilhar} className="flex flex-col items-center gap-1 bg-ink-100 text-base-900 rounded-xl py-3 text-xs font-medium">
              <Share2 size={18} /> Compartilhar
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 bg-[#25D366] text-base-900 rounded-xl py-3 text-xs font-medium"
            >
              <MessageCircle size={18} /> WhatsApp
            </a>
            <button type="button" onClick={copiar} className="flex flex-col items-center gap-1 border border-base-600 rounded-xl py-3 text-xs">
              <Copy size={18} /> Copiar
            </button>
          </div>
          {aviso && <p className="text-sm text-habito mb-3">{aviso}</p>}
        </>
      )}

      {indicados !== null && (
        <p className="text-sm text-ink-400 mt-4 text-center">
          {indicados === 0
            ? "Ninguém entrou pelo seu link ainda."
            : `🎉 ${indicados} pessoa${indicados > 1 ? "s entraram" : " entrou"} pelo seu link. Valeu!`}
        </p>
      )}
    </main>
  );
}

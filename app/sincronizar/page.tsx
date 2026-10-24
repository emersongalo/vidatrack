"use client";

// Etapa 358 — "Esperando sincronizar": tudo o que foi feito no celular e
// ainda não chegou no servidor. Dá pra ver o motivo, tentar de novo agora
// ou desistir de um item. Também mostra o que o servidor recusou.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Trash2, CloudOff, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  chaveAcao,
  descartarDaFila,
  lerFalhas,
  lerFila,
  lerRecusados,
  limparRecusados,
  EVENTO_FILA_MUDOU,
  type AcaoPendente,
  type FalhaFila,
  type Recusado,
} from "@/lib/offline/fila";
import { processarFilaSincronizacao } from "@/lib/offline/processarFila";
import { descreverAcao, haQuanto } from "@/lib/offline/descreverFila";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";
import { vibrar } from "@/lib/app/vibrar";

const COR_AREA: Record<string, string> = { habito: "#7FB894", tarefa: "#9C8FD9", financa: "#D9A24C", agenda: "#38BDF8", outro: "#8A8F98" };

export default function SincronizarPage() {
  const [fila, setFila] = useState<AcaoPendente[]>([]);
  const [falhas, setFalhas] = useState<Record<string, FalhaFila>>({});
  const [recusados, setRecusados] = useState<Recusado[]>([]);
  const [online, setOnline] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const ler = useCallback(() => {
    setFila(lerFila());
    setFalhas(lerFalhas());
    setRecusados(lerRecusados());
    setOnline(navigator.onLine !== false);
  }, []);

  useEffect(() => {
    ler();
    const t = setInterval(ler, 5000);
    window.addEventListener(EVENTO_FILA_MUDOU, ler);
    window.addEventListener("online", ler);
    window.addEventListener("offline", ler);
    return () => {
      clearInterval(t);
      window.removeEventListener(EVENTO_FILA_MUDOU, ler);
      window.removeEventListener("online", ler);
      window.removeEventListener("offline", ler);
    };
  }, [ler]);

  async function sincronizarAgora() {
    vibrar(10);
    setEnviando(true);
    setAviso(null);
    const r = await processarFilaSincronizacao().catch(() => null);
    setEnviando(false);
    ler();
    if (r && r.processados > 0) void atualizarSnapshotEmTodasAsTelas();
    setAviso(!r ? "Não deu pra falar com o servidor agora." : r.restantes === 0 ? "Tudo sincronizado ✅" : `${r.restantes} ainda não ${r.restantes === 1 ? "subiu" : "subiram"} — vai tentar de novo sozinho.`);
  }

  function descartar(chave: string) {
    descartarDaFila(chave);
    setConfirmar(null);
    vibrar(15);
    ler();
    // a tela volta ao que está no servidor
    void atualizarSnapshotEmTodasAsTelas();
    setAviso(navigator.onLine === false ? "Descartado. As telas voltam ao normal quando a internet voltar." : "Descartado.");
  }

  const snap = lerSnapshotOffline();

  return (
    <main className="pagina-curta px-5 md:px-12 pt-3 pb-16">
      <CabecalhoPagina voltarHref="/perfil" voltarTexto="Perfil" emoji="📦" titulo="Esperando sincronizar" subtitulo="O que você fez no celular e ainda vai pro servidor" />

      {/* status */}
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 mb-4 ${fila.length === 0 ? "border-habito/40 bg-habito/10" : online ? "border-financa/40 bg-financa/10" : "border-base-600 bg-base-800"}`}
      >
        {fila.length === 0 ? <CheckCircle2 className="text-habito shrink-0" size={22} /> : online ? <RefreshCw className={`text-financa shrink-0 ${enviando ? "animate-spin" : ""}`} size={20} /> : <CloudOff className="text-ink-400 shrink-0" size={20} />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {fila.length === 0 ? "Tudo sincronizado" : `${fila.length} ${fila.length === 1 ? "alteração esperando" : "alterações esperando"}`}
          </p>
          <p className="text-xs text-ink-400">
            {fila.length === 0 ? "Nada guardado só no celular." : online ? "Com internet: sobe sozinho em segundos." : "Sem internet: sobe sozinho quando a conexão voltar."}
          </p>
        </div>
        {fila.length > 0 && online && (
          <button type="button" onClick={() => void sincronizarAgora()} disabled={enviando} className="shrink-0 rounded-xl bg-financa text-base-900 text-xs font-semibold px-3 py-2 disabled:opacity-60">
            {enviando ? "Enviando…" : "Enviar agora"}
          </button>
        )}
      </div>

      {aviso && <p className="mb-3 text-sm bg-base-800 border border-base-600 rounded-xl px-3 py-2 animate-surgir">{aviso}</p>}

      {/* fila */}
      {fila.length > 0 && (
        <ul className="space-y-1.5 mb-6">
          {fila.map((a, i) => {
            const k = chaveAcao(a);
            const d = descreverAcao(a, snap as any);
            const falha = falhas[k];
            const em = (a as any).criadoEm as number | undefined;
            return (
              <li key={k} className="rounded-xl border border-base-600 bg-base-800 px-3 py-2.5 animate-entrar" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0" style={{ background: `${COR_AREA[d.area]}22` }}>
                    {d.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.titulo}</p>
                    <p className="text-[11px] text-ink-400 truncate">
                      {[d.detalhe, em ? `feito ${haQuanto(em)}` : null].filter(Boolean).join(" · ") || "esperando"}
                    </p>
                  </div>
                  {confirmar === k ? (
                    <span className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => descartar(k)} className="rounded-lg bg-red-500/90 text-white text-[11px] font-semibold px-2 py-1.5">
                        Descartar
                      </button>
                      <button type="button" onClick={() => setConfirmar(null)} className="rounded-lg border border-base-600 text-[11px] px-2 py-1.5">
                        Não
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirmar(k)} aria-label="Descartar" className="p-1.5 text-ink-400 hover:text-red-400 shrink-0">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                {falha && (
                  <p className="mt-1.5 text-[11px] text-financa flex items-start gap-1">
                    <AlertTriangle size={12} className="shrink-0 mt-px" />
                    <span>
                      Tentou {falha.tentativas}× ({haQuanto(falha.em)}): {falha.erro}
                    </span>
                  </p>
                )}
                {confirmar === k && <p className="mt-1.5 text-[11px] text-red-400">Isso desfaz essa alteração no celular — ela não vai pro servidor.</p>}
              </li>
            );
          })}
        </ul>
      )}

      {/* recusados */}
      {recusados.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <h2 className="text-[11px] uppercase tracking-[0.14em] text-ink-400 font-semibold">O servidor não aceitou</h2>
            <button type="button" onClick={() => (limparRecusados(), ler())} className="text-[11px] text-ink-400 hover:text-ink-100">
              limpar
            </button>
          </div>
          <ul className="space-y-1.5">
            {recusados.map((r, i) => {
              const d = descreverAcao(r.acao, snap as any);
              return (
                <li key={i} className="rounded-xl border border-red-400/30 bg-red-400/5 px-3 py-2">
                  <p className="text-sm">
                    {d.emoji} {d.titulo} <span className="text-[11px] text-ink-400">· {haQuanto(r.em)}</span>
                  </p>
                  <p className="text-[11px] text-red-400 mt-0.5">{r.erro}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="text-xs text-ink-400 mt-6">
        Dica: o VidaTrack salva tudo primeiro no celular e manda pro servidor sozinho. Você não precisa fazer nada aqui — esta tela é só pra conferir.{" "}
        <Link href="/ajuda" className="underline">
          Ajuda
        </Link>
      </p>
    </main>
  );
}

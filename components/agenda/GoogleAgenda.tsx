"use client";

// Etapa 359 — ligar a Agenda com o Google Agenda:
// 1) VidaTrack → Google: um link pessoal pra "assinar" no Google Agenda
//    (os compromissos aparecem lá e no calendário do celular);
// 2) Google → VidaTrack: importar um arquivo .ics exportado do Google.
import { useRef, useState } from "react";
import { X, Link2, Copy, Upload, Check } from "lucide-react";
import { linkAgendaGoogle } from "@/lib/agenda/actions";
import { lerIcs, type EventoImportado } from "@/lib/agenda/ics";
import { juntarEmoji, separarEmoji, sugerirEmoji } from "@/lib/agenda/visual";
import { lembretesPadrao } from "@/lib/agenda/eventos";
import type { EventoAgenda } from "@/lib/agenda/useAgenda";
import type { ValoresForm } from "@/components/agenda/FormEvento";
import { vibrar } from "@/lib/app/vibrar";

export function GoogleAgenda({
  eventos,
  aoSalvar,
  aoFechar,
}: {
  eventos: EventoAgenda[];
  aoSalvar: (v: ValoresForm, convidados: string[]) => Promise<string | null>;
  aoFechar: () => void;
}) {
  const [link, setLink] = useState<{ https: string; webcal: string } | null>(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [lidos, setLidos] = useState<EventoImportado[] | null>(null);
  const [importando, setImportando] = useState(false);
  const [feito, setFeito] = useState<number | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  async function gerar() {
    setErro(null);
    if (navigator.onLine === false) return setErro("Precisa de internet pra gerar o link.");
    setGerando(true);
    const r: { https?: string; webcal?: string; erro?: string } = await linkAgendaGoogle().catch(() => ({ erro: "Não deu agora — tente de novo." }));
    setGerando(false);
    if (r.erro || !r.https || !r.webcal) return setErro(r.erro ?? "Não deu agora — tente de novo.");
    setLink({ https: r.https, webcal: r.webcal });
  }

  async function copiar() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.https);
      setCopiado(true);
      vibrar(10);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Não deu pra copiar — segure o link e copie.");
    }
  }

  // já existe igual? (mesmo título, dia e hora) — não duplica
  const existentes = new Set(eventos.map((e) => `${separarEmoji(e.titulo).texto.toLowerCase()}|${e.data}|${(e.hora_inicio ?? "").slice(0, 5)}`));
  const novos = (lidos ?? []).filter((x) => !existentes.has(`${separarEmoji(x.titulo).texto.toLowerCase()}|${x.data}|${x.hora_inicio ?? ""}`));

  async function lerArquivo(f: File | undefined) {
    setErro(null);
    setFeito(null);
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return setErro("Arquivo grande demais (máx. 5 MB).");
    const texto = await f.text();
    const r = lerIcs(texto);
    if (!r.length) return setErro("Não achei compromissos nesse arquivo. Use o .ics exportado do Google Agenda.");
    setLidos(r);
  }

  async function importar() {
    setImportando(true);
    let ok = 0;
    for (const x of novos.slice(0, 500)) {
      const r = await aoSalvar(
        {
          titulo: juntarEmoji(separarEmoji(x.titulo).emoji ?? sugerirEmoji(x.titulo), x.titulo),
          tipo: "evento",
          data: x.data,
          hora_inicio: x.hora_inicio,
          hora_fim: x.hora_fim,
          repetir: x.repetir,
          repetir_ate: x.repetir_ate,
          local: x.local,
          descricao: x.descricao,
          cor: "azul",
          lembretes: lembretesPadrao("evento", !!x.hora_inicio),
        },
        []
      );
      if (!r) ok++;
    }
    setImportando(false);
    setFeito(ok);
    setLidos(null);
    vibrar([15, 40, 25]);
  }

  const urlGoogle = link ? `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(link.webcal)}` : "";
  const passo = "flex gap-2 text-xs text-ink-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-fundo" onClick={aoFechar}>
      <div
        className="animate-folha w-full max-w-lg max-h-[92vh] overflow-y-auto bg-base-800 border-t sm:border border-base-600 rounded-t-3xl sm:rounded-3xl p-5"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-display font-semibold">🔗 Google Agenda</p>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="p-1 text-ink-400 hover:text-ink-100">
            <X size={22} />
          </button>
        </div>

        {/* 1) VidaTrack → Google */}
        <section className="rounded-2xl border border-base-600 p-4 mb-3">
          <p className="font-semibold text-sm mb-1">Ver meus compromissos no Google Agenda</p>
          <p className="text-xs text-ink-400 mb-3">Seus compromissos do VidaTrack (e os que te convidaram) aparecem no Google Agenda e no calendário do celular. Novos e alterados aparecem lá sozinhos.</p>
          {!link ? (
            <button type="button" onClick={() => void gerar()} disabled={gerando} className="w-full flex items-center justify-center gap-2 rounded-xl bg-nota text-base-900 font-semibold py-2.5 text-sm disabled:opacity-60">
              <Link2 size={16} /> {gerando ? "Gerando…" : "Gerar meu link"}
            </button>
          ) : (
            <div className="space-y-2 animate-surgir">
              <a href={urlGoogle} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 rounded-xl bg-nota text-base-900 font-semibold py-2.5 text-sm">
                ➕ Adicionar no Google Agenda
              </a>
              <button type="button" onClick={() => void copiar()} className="w-full flex items-center justify-center gap-2 rounded-xl border border-base-600 py-2.5 text-sm">
                {copiado ? <Check size={15} className="text-habito" /> : <Copy size={15} />} {copiado ? "Copiado!" : "Copiar link"}
              </button>
              <p className="text-[11px] text-ink-400 break-all bg-base-900 rounded-lg px-2 py-1.5">{link.https}</p>
              <div className="space-y-1 pt-1">
                <p className={passo}>
                  <span>1.</span> Toque em &quot;Adicionar no Google Agenda&quot; (melhor pelo computador) e confirme.
                </p>
                <p className={passo}>
                  <span>2.</span> Ou no Google Agenda: Outras agendas → ＋ → &quot;Do URL&quot; → cole o link.
                </p>
                <p className={passo}>
                  <span>⏱</span> O Google atualiza esse tipo de agenda de tempos em tempos (pode levar algumas horas pra uma mudança aparecer lá).
                </p>
                <p className={passo}>
                  <span>🔒</span> O link é só seu: não compartilhe (quem tiver ele consegue ver sua agenda).
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 2) Google → VidaTrack */}
        <section className="rounded-2xl border border-base-600 p-4">
          <p className="font-semibold text-sm mb-1">Trazer compromissos do Google Agenda</p>
          <p className="text-xs text-ink-400 mb-3">
            No Google Agenda (pelo computador): Configurações → Importar e exportar → <b>Exportar</b>. Vem um .zip: abra e escolha o arquivo <b>.ics</b> aqui.
          </p>
          <input ref={arquivo} type="file" accept=".ics,text/calendar" className="hidden" onChange={(e) => void lerArquivo(e.target.files?.[0])} />
          {!lidos ? (
            <button type="button" onClick={() => arquivo.current?.click()} className="w-full flex items-center justify-center gap-2 rounded-xl border border-base-600 py-2.5 text-sm hover:border-ink-400">
              <Upload size={15} /> Escolher arquivo .ics
            </button>
          ) : (
            <div className="space-y-2 animate-surgir">
              <p className="text-sm">
                Achei <b>{lidos.length}</b> {lidos.length === 1 ? "compromisso" : "compromissos"}
                {lidos.length !== novos.length && <span className="text-ink-400"> ({lidos.length - novos.length} já estão na sua agenda)</span>}.
              </p>
              <ul className="max-h-40 overflow-y-auto text-xs text-ink-400 space-y-0.5">
                {novos.slice(0, 30).map((x, i) => (
                  <li key={i} className="truncate">
                    {x.data.split("-").reverse().join("/")} {x.hora_inicio ?? ""} · {x.titulo}
                  </li>
                ))}
                {novos.length > 30 && <li>… e mais {novos.length - 30}</li>}
              </ul>
              <div className="flex gap-2">
                <button type="button" onClick={() => void importar()} disabled={importando || !novos.length} className="flex-1 rounded-xl bg-nota text-base-900 font-semibold py-2.5 text-sm disabled:opacity-50">
                  {importando ? "Importando…" : `Importar ${novos.length}`}
                </button>
                <button type="button" onClick={() => setLidos(null)} className="rounded-xl border border-base-600 px-3 text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {feito !== null && <p className="mt-2 text-sm text-habito animate-surgir">✅ {feito} {feito === 1 ? "compromisso importado" : "compromissos importados"}.</p>}
        </section>

        {erro && <p className="mt-3 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">{erro}</p>}
      </div>
    </div>
  );
}

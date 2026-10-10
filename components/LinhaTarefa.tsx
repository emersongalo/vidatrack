"use client";

// Etapa 259 — uma tarefa na lista: bolinha pra concluir (na cor da
// categoria), título, quando, prioridade, subtarefas e lançamento.
// Etapa 285 — tarefa com anotação ou subtarefas abre ali mesmo: lê a
// nota, marca as subtarefas e conclui sem sair da lista.
import Link from "next/link";
import { useRef, useState } from "react";
import { explodirEm, textoFlutuante, frasePositiva } from "@/lib/app/festa";
import { Check, Repeat, ListChecks, Wallet, ChevronDown, StickyNote, Pencil } from "lucide-react";
import { IconeHabito } from "@/components/IconeHabito";
import { PRIORIDADES, descreverRepeticao } from "@/lib/agenda/recorrencia";
import { rotuloData } from "@/lib/agenda/tarefasLista";
import { alternarSubtarefa } from "@/app/habitos/tarefas/actions";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { vibrar } from "@/lib/app/vibrar";

type Sub = { id: string; texto: string; feita: boolean };

export function LinhaTarefa({
  tarefa,
  feita,
  proxima,
  hoje,
  atrasada,
  cor,
  nomeCategoria,
  aoAlternar,
  aoAdiar,
}: {
  tarefa: any;
  feita: boolean;
  proxima: string | null;
  hoje: string;
  atrasada: boolean;
  cor: string;
  nomeCategoria?: string | null;
  aoAlternar: () => void;
  /** Etapa 278 — arrastar pra esquerda: adia pra amanhã */
  aoAdiar?: () => void;
}) {
  const [subsLocal, setSubsLocal] = useState<Sub[] | null>(null);
  const subtarefas = (subsLocal ?? tarefa.subtarefas ?? []) as Sub[];
  const nota = String(tarefa.observacoes ?? "").trim();
  const temDetalhe = !!nota || subtarefas.length > 0;
  const [aberta, setAberta] = useState(false);
  const repete = tarefa.repetir !== "nenhuma";
  const prioridade = tarefa.prioridade ?? 0;
  // Etapa 273 — confete + frase ao concluir
  const refBotao = useRef<HTMLButtonElement>(null);
  const [vezes, setVezes] = useState(0);

  // Etapa 278 — gestos: → conclui (ou desmarca), ← adia pra amanhã
  const [arrasto, setArrasto] = useState(0);
  const toque = useRef<{ x: number; y: number; decidido: boolean; horizontal: boolean } | null>(null);
  const arrastou = useRef(false);
  const podeAdiar = !!aoAdiar && !repete && !feita;
  const LIMIAR = 80;
  function aoTocar(e: React.TouchEvent) {
    toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, decidido: false, horizontal: false };
    arrastou.current = false;
  }
  function aoMover(e: React.TouchEvent) {
    const t = toque.current;
    if (!t) return;
    const dx = e.touches[0].clientX - t.x;
    const dy = e.touches[0].clientY - t.y;
    if (!t.decidido) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      t.decidido = true;
      t.horizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (!t.horizontal) return;
    arrastou.current = true;
    const limiteEsq = podeAdiar ? 140 : 0;
    setArrasto(Math.max(-limiteEsq, Math.min(140, dx)));
  }
  function aoSoltar() {
    const dx = arrasto;
    toque.current = null;
    setArrasto(0);
    if (dx > LIMIAR) clicar();
    else if (dx < -LIMIAR && podeAdiar) aoAdiar?.();
  }

  function clicar() {
    if (!feita) {
      explodirEm(refBotao.current, { cor, emojis: ["✨"] });
      textoFlutuante(refBotao.current, frasePositiva(), cor);
      setVezes((n) => n + 1);
    }
    aoAlternar();
  }

  function concluirDaNota() {
    clicar();
    if (!feita) setTimeout(() => setAberta(false), 450);
  }

  async function marcarSub(id: string) {
    vibrar(8);
    const antes = subtarefas;
    setSubsLocal(antes.map((s) => (s.id === id ? { ...s, feita: !s.feita } : s)));
    try {
      await alternarSubtarefa(tarefa.id, id);
      void atualizarSnapshotEmTodasAsTelas();
    } catch {
      setSubsLocal(antes);
    }
  }

  const subsFeitas = subtarefas.filter((s) => s.feita).length;

  const detalhes = (
    <>
      <p className={`text-base font-medium truncate transition-colors duration-300 ${feita ? "text-ink-400" : ""}`}>
        <span className={feita ? "riscado" : ""}>{tarefa.titulo}</span>
      </p>
      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-xs text-ink-400">
        {prioridade > 0 && (
          <span className={`flex items-center gap-1 ${PRIORIDADES[prioridade].classe}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORIDADES[prioridade].fundo}`} />
            {PRIORIDADES[prioridade].rotulo}
          </span>
        )}
        {repete ? (
          <span className="flex items-center gap-1">
            <Repeat size={11} /> {descreverRepeticao(tarefa)}
            {proxima && proxima !== hoje && ` · ${rotuloData(proxima, hoje)}`}
          </span>
        ) : (
          tarefa.data && (
            <span className={atrasada && !feita ? "text-red-400 font-medium" : ""}>
              {atrasada && !feita ? `atrasada · ${rotuloData(tarefa.data, hoje)}` : rotuloData(tarefa.data, hoje)}
            </span>
          )
        )}
        {tarefa.horario_lembrete && <span>· ⏰ {String(tarefa.horario_lembrete).slice(0, 5)}</span>}
        {subtarefas.length > 0 && (
          <span className="flex items-center gap-1">
            · <ListChecks size={11} /> {subsFeitas}/{subtarefas.length}
          </span>
        )}
        {tarefa.financa_valor && (
          <span className="flex items-center gap-1">
            · <Wallet size={11} /> R$ {Number(tarefa.financa_valor).toFixed(2).replace(".", ",")}
          </span>
        )}
        {nomeCategoria && <span style={{ color: cor }}>· {nomeCategoria}</span>}
      </div>
      {/* prévia da anotação (fechada) */}
      {nota && !aberta && (
        <p className="flex items-center gap-1.5 text-sm text-ink-400 mt-1 min-w-0">
          <StickyNote size={13} className="shrink-0" style={{ color: cor }} />
          <span className="truncate">{nota.replace(/\s+/g, " ")}</span>
        </p>
      )}
      {subtarefas.length > 0 && !feita && !aberta && (
        <div className="h-1 rounded-full bg-base-900 mt-1.5 overflow-hidden max-w-[10rem]">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(subsFeitas / subtarefas.length) * 100}%`, background: cor }} />
        </div>
      )}
    </>
  );

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {arrasto !== 0 && (
        <div
          aria-hidden
          className={`absolute inset-0 flex items-center px-5 text-sm font-semibold rounded-2xl ${
            arrasto > 0 ? "justify-start text-base-900" : "justify-end bg-[#4C8FCC] text-white"
          }`}
          style={arrasto > 0 ? { background: cor } : undefined}
        >
          {arrasto > 0 ? (feita ? "Desmarcar" : "✓ Concluir") : "Amanhã →"}
        </div>
      )}
      <div
        data-gesto-proprio="1"
        onTouchStart={aoTocar}
        onTouchMove={aoMover}
        onTouchEnd={aoSoltar}
        onClickCapture={(e) => {
          if (arrastou.current) {
            e.preventDefault();
            e.stopPropagation();
            arrastou.current = false;
          }
        }}
        style={{ transform: arrasto ? `translateX(${arrasto}px)` : undefined, transition: arrasto ? "none" : "transform 200ms, opacity 500ms" }}
        className={`group relative overflow-hidden bg-base-800 border rounded-2xl transition ${
          aberta ? "border-ink-400/40" : atrasada && !feita ? "border-red-400/40" : "border-base-600"
        } ${feita && !aberta ? "opacity-60" : ""} transition-opacity duration-500`}
      >
        {feita && vezes > 0 && <span key={`v-${vezes}`} aria-hidden className="varredura rounded-2xl" />}
        {/* faixa da categoria */}
        <span aria-hidden className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ background: cor }} />

        <div className="flex items-center gap-3 pl-3 pr-4 py-3">
          <button
            type="button"
            ref={refBotao}
            onClick={clicar}
            aria-label={feita ? "Desmarcar" : "Concluir"}
            className={`ml-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition active:scale-90 ${
              feita ? "animate-pop" : "hover:scale-105"
            }`}
            style={feita ? { background: cor, borderColor: cor } : { borderColor: cor }}
          >
            {feita && <Check key={vezes} size={17} strokeWidth={3} className="text-base-900 animate-surgir" />}
          </button>

          {temDetalhe ? (
            <button
              type="button"
              onClick={() => {
                vibrar(6);
                setAberta((v) => !v);
              }}
              aria-expanded={aberta}
              className="flex-1 min-w-0 text-left"
            >
              {detalhes}
            </button>
          ) : (
            <Link href={`/tarefas/${tarefa.id}`} className="flex-1 min-w-0">
              {detalhes}
            </Link>
          )}

          {temDetalhe ? (
            <button
              type="button"
              onClick={() => setAberta((v) => !v)}
              aria-label={aberta ? "Fechar anotação" : "Abrir anotação"}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${cor}1f`, color: cor }}
            >
              <ChevronDown size={18} className={`transition-transform duration-300 ${aberta ? "rotate-180" : ""}`} />
            </button>
          ) : (
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cor}1f`, color: cor }}>
              <IconeHabito icone={tarefa.icone} tamanho={17} />
            </span>
          )}
        </div>

        {/* Etapa 285 — a anotação abre na própria lista */}
        {temDetalhe && (
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${aberta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div className="pl-4 pr-4 pb-4 sm:pl-[3.75rem]">
                {nota && (
                  <div className="rounded-xl bg-base-900/60 border border-base-600 px-3.5 py-3 text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words">
                    {nota}
                  </div>
                )}
                {subtarefas.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {subtarefas.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => marcarSub(s.id)}
                          className="w-full flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm active:bg-base-700"
                        >
                          <span
                            className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition"
                            style={s.feita ? { background: cor, borderColor: cor } : { borderColor: `${cor}99` }}
                          >
                            {s.feita && <Check size={12} strokeWidth={3.2} className="text-base-900" />}
                          </span>
                          <span className={s.feita ? "line-through text-ink-400" : ""}>{s.texto}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={concluirDaNota}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold active:scale-[0.98] transition"
                    style={feita ? { border: `1px solid ${cor}`, color: cor } : { background: cor, color: "#0F1013" }}
                  >
                    <Check size={16} strokeWidth={2.8} /> {feita ? "Desmarcar" : "Li e concluí"}
                  </button>
                  <Link
                    href={`/tarefas/${tarefa.id}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm border border-base-600 text-ink-400 hover:text-ink-100 transition"
                  >
                    <Pencil size={14} /> Editar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

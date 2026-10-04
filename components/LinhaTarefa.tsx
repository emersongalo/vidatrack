"use client";

// Etapa 259 — uma tarefa na lista: bolinha pra concluir (na cor da
// categoria), título, quando, prioridade, subtarefas e lançamento.
import Link from "next/link";
import { Check, Repeat, ListChecks, Wallet } from "lucide-react";
import { IconeHabito } from "@/components/IconeHabito";
import { PRIORIDADES, descreverRepeticao } from "@/lib/agenda/recorrencia";
import { rotuloData } from "@/lib/agenda/tarefasLista";

export function LinhaTarefa({
  tarefa,
  feita,
  proxima,
  hoje,
  atrasada,
  cor,
  nomeCategoria,
  aoAlternar,
}: {
  tarefa: any;
  feita: boolean;
  proxima: string | null;
  hoje: string;
  atrasada: boolean;
  cor: string;
  nomeCategoria?: string | null;
  aoAlternar: () => void;
}) {
  const subtarefas = (tarefa.subtarefas ?? []) as { feita: boolean }[];
  const repete = tarefa.repetir !== "nenhuma";
  const prioridade = tarefa.prioridade ?? 0;

  return (
    <div
      className={`group relative flex items-center gap-3 bg-base-800 border rounded-2xl pl-3 pr-4 py-3 transition ${
        atrasada && !feita ? "border-red-400/40" : "border-base-600"
      } ${feita ? "opacity-60" : ""}`}
    >
      {/* faixa da categoria */}
      <span aria-hidden className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ background: cor }} />

      <button
        type="button"
        onClick={aoAlternar}
        aria-label={feita ? "Desmarcar" : "Concluir"}
        className={`ml-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition active:scale-90 ${
          feita ? "animate-pop" : "hover:scale-105"
        }`}
        style={feita ? { background: cor, borderColor: cor } : { borderColor: cor }}
      >
        {feita && <Check size={17} strokeWidth={3} className="text-base-900" />}
      </button>

      <Link href={`/habitos/tarefas/${tarefa.id}`} className="flex-1 min-w-0">
        <p className={`text-base font-medium truncate ${feita ? "line-through text-ink-400" : ""}`}>{tarefa.titulo}</p>
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
              · <ListChecks size={11} /> {subtarefas.filter((s) => s.feita).length}/{subtarefas.length}
            </span>
          )}
          {tarefa.financa_valor && (
            <span className="flex items-center gap-1">
              · <Wallet size={11} /> R$ {Number(tarefa.financa_valor).toFixed(2).replace(".", ",")}
            </span>
          )}
          {nomeCategoria && <span style={{ color: cor }}>· {nomeCategoria}</span>}
        </div>
        {subtarefas.length > 0 && !feita && (
          <div className="h-1 rounded-full bg-base-900 mt-1.5 overflow-hidden max-w-[10rem]">
            <div className="h-full rounded-full" style={{ width: `${(subtarefas.filter((s) => s.feita).length / subtarefas.length) * 100}%`, background: cor }} />
          </div>
        )}
      </Link>

      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-ink-400" style={{ background: `${cor}1f`, color: cor }}>
        <IconeHabito icone={tarefa.icone} tamanho={17} />
      </span>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Pencil, Share2, Archive } from "lucide-react";
import { ListaArrastavel } from "@/components/ListaArrastavel";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { IconeHabito } from "@/components/IconeHabito";
import { arquivarHabito, reordenarHabitos } from "@/app/habitos/actions";

const RÓTULOS_FREQUENCIA: Record<string, string> = {
  diaria: "Todos os dias",
  dias_semana: "Dias específicos",
};

type Habito = {
  id: string;
  nome: string;
  cor: string;
  icone: string;
  frequencia: string;
  categorias_produtividade: { nome: string } | null;
  streakAtual?: number;
  melhorStreak?: number;
  eh_negativo?: boolean;
};

export function ListaHabitosArrastavel({ habitos }: { habitos: Habito[] }) {
  return (
    <ListaArrastavel
      itens={habitos}
      aoReordenar={reordenarHabitos}
      renderItem={(habito, arrastando) => (
        <div
          className={`flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-3 transition ${
            arrastando ? "opacity-50" : ""
          }`}
        >
          <span className="text-ink-400 text-sm select-none" aria-hidden>
            ⠿
          </span>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${classeFundoSuave(
              habito.cor
            )}`}
          >
            <IconeHabito icone={habito.icone} tamanho={19} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{habito.nome}</p>
            <p className="text-xs text-ink-400">
              {RÓTULOS_FREQUENCIA[habito.frequencia]}
              {habito.categorias_produtividade?.nome && ` · ${habito.categorias_produtividade.nome}`}
              {habito.eh_negativo ? (
                (habito.streakAtual ?? 0) > 0 && (
                  <span className="text-financa"> · 🛡️ {habito.streakAtual} dias limpo</span>
                )
              ) : (
                <>
                  {(habito.streakAtual ?? 0) > 0 && (
                    <span className="text-financa"> · 🔥 {habito.streakAtual}</span>
                  )}
                  {(habito.melhorStreak ?? 0) > 0 && <span> · recorde {habito.melhorStreak}</span>}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2.5 text-xs shrink-0">
            <Link
              href={`/habitos/${habito.id}/editar`}
              aria-label="Editar"
              className="text-ink-400 hover:text-ink-100 transition"
            >
              <Pencil size={15} strokeWidth={2} />
            </Link>
            <Link
              href={`/habitos/${habito.id}/compartilhar`}
              aria-label="Compartilhar"
              className="text-ink-400 hover:text-ink-100 transition"
            >
              <Share2 size={15} strokeWidth={2} />
            </Link>
            <BotaoComConfirmacao
              acao={() => arquivarHabito(habito.id)}
              textoBotao={<Archive size={15} strokeWidth={2} />}
              textoConfirmacao={`Arquivar "${habito.nome}"?`}
              classeBotao="text-ink-400 hover:text-red-400 transition"
            />
          </div>
        </div>
      )}
    />
  );
}

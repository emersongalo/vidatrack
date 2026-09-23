"use client";

import Link from "next/link";
import { Pencil, Share2, Archive } from "lucide-react";
import { ListaArrastavel } from "@/components/ListaArrastavel";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { MenuAcoes, ItemMenuAcoes } from "@/components/MenuAcoes";
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

export function ListaHabitosArrastavel({ habitos, aoMudar }: { habitos: Habito[]; aoMudar?: () => void }) {
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
            <MenuAcoes>
              {(fecharMenu) => (
                <>
                  <ItemMenuAcoes href={`/habitos/${habito.id}/editar`}>
                    <Pencil size={15} strokeWidth={2} /> Editar
                  </ItemMenuAcoes>
                  <ItemMenuAcoes href={`/habitos/${habito.id}/compartilhar`}>
                    <Share2 size={15} strokeWidth={2} /> Compartilhar
                  </ItemMenuAcoes>
                  <div className="my-1 border-t border-base-600" />
                  <BotaoComConfirmacao
                    acao={() => arquivarHabito(habito.id)}
                    textoBotao={
                      <span className="flex items-center gap-2.5">
                        <Archive size={15} strokeWidth={2} /> Arquivar
                      </span>
                    }
                    textoConfirmacao={`Arquivar "${habito.nome}"?`}
                    classeBotao="flex items-center w-full px-3.5 py-2 text-sm text-left text-ink-100 hover:bg-base-700 transition"
                    aoConcluir={() => {
                      aoMudar?.();
                      fecharMenu();
                    }}
                  />
                </>
              )}
            </MenuAcoes>
          </div>
        </div>
      )}
    />
  );
}

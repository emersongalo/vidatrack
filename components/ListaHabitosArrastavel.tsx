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
  semanal: "Algumas vezes por semana",
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
      classeLista="bg-base-800 border border-base-600 rounded-3xl overflow-hidden divide-y divide-base-600"
      renderItem={(habito, arrastando) => (
        // Etapa 227 — linha no estilo da lista de Contas: ícone redondo, nome e
        // frequência, e a sequência 🔥 à direita (no lugar do saldo)
        <div className={`flex items-center gap-3 px-4 py-3.5 transition ${arrastando ? "opacity-50" : ""}`}>
          <span className="text-ink-400 text-sm select-none hidden md:block" aria-hidden>
            ⠿
          </span>
          <Link href={`/habitos/${habito.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <span
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${classeFundoSuave(habito.cor)}`}
            >
              <IconeHabito icone={habito.icone} tamanho={22} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-lg font-medium truncate">{habito.nome}</span>
              <span className="block text-sm text-ink-400 truncate">
                {RÓTULOS_FREQUENCIA[habito.frequencia] ?? "Personalizado"}
                {habito.categorias_produtividade?.nome && ` · ${habito.categorias_produtividade.nome}`}
              </span>
            </span>
            <span className="text-right shrink-0">
              {habito.eh_negativo ? (
                <>
                  <span className="block text-lg font-semibold">🛡️ {habito.streakAtual ?? 0}</span>
                  <span className="block text-xs text-ink-400">dias limpo</span>
                </>
              ) : (
                <>
                  <span className={`block text-lg font-semibold ${(habito.streakAtual ?? 0) > 0 ? "text-financa" : "text-ink-400"}`}>
                    🔥 {habito.streakAtual ?? 0}
                  </span>
                  <span className="block text-xs text-ink-400">recorde {habito.melhorStreak ?? 0}</span>
                </>
              )}
            </span>
          </Link>
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
      )}
    />
  );
}

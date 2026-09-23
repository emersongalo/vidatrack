"use client";

import Link from "next/link";
import { removerCategoria } from "../actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { IconeCategoria } from "@/components/IconeCategoria";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { MenuAcoes, ItemMenuAcoes } from "@/components/MenuAcoes";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { Pencil, Trash2 } from "lucide-react";

/**
 * Etapa 168 — redesenhada como grade de cartões com ícone circular
 * grande, inspirado no Despezzas (que mostra categoria assim, em vez
 * de uma lista de linhas finas). Editar/Remover só aparece nas suas
 * próprias — nas de quem compartilha com você, mostra só "Compartilhada".
 */
export default function CategoriasPage() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const meuId = snapshot?.perfil.id;
  const categorias = [...(snapshot?.financas.categorias ?? [])].sort((a: any, b: any) =>
    a.tipo === b.tipo ? a.nome.localeCompare(b.nome) : a.tipo.localeCompare(b.tipo)
  );
  const receitas = categorias.filter((c: any) => c.tipo === "receita");
  const despesas = categorias.filter((c: any) => c.tipo === "despesa");

  function CartaoCategoria({ cat }: { cat: any }) {
    const ehMinha = cat.dono_id === meuId;
    return (
      <div className="relative bg-base-800 border border-base-600 rounded-xl2 p-4 flex flex-col items-center text-center">
        {ehMinha ? (
          <div className="absolute top-2 right-2">
            <MenuAcoes>
              {(fecharMenu) => (
                <>
                  <ItemMenuAcoes href={`/financas/categorias/${cat.id}/editar`}>
                    <Pencil size={15} strokeWidth={2} /> Editar
                  </ItemMenuAcoes>
                  <BotaoComConfirmacao
                    acao={removerCategoria.bind(null, cat.id)}
                    textoBotao={
                      <span className="flex items-center gap-2.5">
                        <Trash2 size={15} strokeWidth={2} /> Remover
                      </span>
                    }
                    textoConfirmacao={`Remover "${cat.nome}"? Lançamentos que usam ela ficam sem categoria.`}
                    classeBotao="flex items-center w-full px-3.5 py-2 text-sm text-left text-red-400 hover:bg-base-700 transition"
                    aoConcluir={() => {
                      recarregar();
                      fecharMenu();
                    }}
                  />
                </>
              )}
            </MenuAcoes>
          </div>
        ) : (
          <span className="absolute top-2.5 right-2.5 text-[10px] text-ink-400 bg-base-700 rounded-full px-2 py-0.5">
            Compartilhada
          </span>
        )}
        <span
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl mb-2.5 ${classeFundoSuave(cat.cor)}`}
        >
          <IconeCategoria icone={cat.icone} />
        </span>
        <p className="text-sm font-medium truncate max-w-full">{cat.nome}</p>
        {cat.meta_mensal && (
          <p className="text-[11px] text-ink-400 mt-0.5">até {formatarMoeda(Number(cat.meta_mensal))}</p>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl lg:max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
            ← Finanças
          </Link>
          <h1 className="text-2xl font-display font-semibold mt-2">Categorias</h1>
        </div>
        <Link
          href="/financas/categorias/nova"
          className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
        >
          + Nova
        </Link>
      </div>

      {despesas.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-ink-400 mb-3 uppercase tracking-wide">Despesas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {despesas.map((cat: any) => (
              <CartaoCategoria key={cat.id} cat={cat} />
            ))}
          </div>
        </div>
      )}

      {receitas.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-ink-400 mb-3 uppercase tracking-wide">Receitas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {receitas.map((cat: any) => (
              <CartaoCategoria key={cat.id} cat={cat} />
            ))}
          </div>
        </div>
      )}

      {snapshot !== undefined && categorias.length === 0 && <p className="text-ink-400 text-sm">🏷️ Nenhuma categoria ainda.</p>}
    </main>
  );
}

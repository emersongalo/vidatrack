"use client";

import Link from "next/link";
import { removerCategoria } from "../actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { IconeCategoria } from "@/components/IconeCategoria";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 128
export default function CategoriasPage() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const categorias = [...(snapshot?.financas.categorias ?? [])].sort((a: any, b: any) =>
    a.tipo === b.tipo ? a.nome.localeCompare(b.nome) : a.tipo.localeCompare(b.tipo)
  );
  const receitas = categorias.filter((c: any) => c.tipo === "receita");
  const despesas = categorias.filter((c: any) => c.tipo === "despesa");

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-3xl mx-auto">
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

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        {despesas.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-ink-400 mb-2 uppercase tracking-wide">Despesas</p>
            <ul className="space-y-1.5">
              {despesas.map((cat: any) => (
                <li key={cat.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(cat.cor)}`}>
                    <IconeCategoria icone={cat.icone} />
                  </span>
                  <span className="flex-1 text-sm truncate">{cat.nome}</span>
                  {cat.meta_mensal && (
                    <span className="text-ink-400 font-mono text-xs shrink-0">até {formatarMoeda(Number(cat.meta_mensal))}</span>
                  )}
                  <Link href={`/financas/categorias/${cat.id}/editar`} className="text-ink-400 hover:text-ink-100 transition text-xs shrink-0">
                    Editar
                  </Link>
                  <BotaoComConfirmacao acao={removerCategoria.bind(null, cat.id)} textoBotao="Remover" aoConcluir={recarregar} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {receitas.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-ink-400 mb-2 uppercase tracking-wide">Receitas</p>
            <ul className="space-y-1.5">
              {receitas.map((cat: any) => (
                <li key={cat.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(cat.cor)}`}>
                    <IconeCategoria icone={cat.icone} />
                  </span>
                  <span className="flex-1 text-sm truncate">{cat.nome}</span>
                  <Link href={`/financas/categorias/${cat.id}/editar`} className="text-ink-400 hover:text-ink-100 transition text-xs shrink-0">
                    Editar
                  </Link>
                  <BotaoComConfirmacao acao={removerCategoria.bind(null, cat.id)} textoBotao="Remover" aoConcluir={recarregar} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {snapshot !== undefined && categorias.length === 0 && <p className="text-ink-400 text-sm">Nenhuma categoria ainda.</p>}
    </main>
  );
}

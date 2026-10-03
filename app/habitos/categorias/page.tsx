"use client";

import Link from "next/link";
import { removerCategoriaProdutividade } from "./actions";
import { classeCor } from "@/lib/agenda/estilo";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { EstadoVazio } from "@/components/EstadoVazio";

// Etapa 127
export default function CategoriasProdutividadePage() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const categorias = [...(snapshot?.categoriasProdutividade ?? [])].sort((a: any, b: any) => a.nome.localeCompare(b.nome));

  return (
    <main className="pagina px-6 md:px-12 pt-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold">Categorias</h1>
        <Link
          href="/habitos/categorias/nova"
          className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
        >
          + Nova
        </Link>
      </div>

      {snapshot !== undefined && categorias.length === 0 ? (
        <EstadoVazio tom="habito" emoji="🗂️" titulo="Nenhuma categoria ainda" texto='Categorias funcionam como listas — ex: "Trabalho", "Saúde", "Casa".' />
      ) : (
        <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
          {categorias.map((cat: any) => (
            <li key={cat.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5">
              <span className={`w-3 h-3 rounded-full shrink-0 ${classeCor(cat.cor)}`} />
              <span className="flex-1 text-sm">{cat.nome}</span>
              <BotaoComConfirmacao
                acao={removerCategoriaProdutividade.bind(null, cat.id)}
                textoBotao="Remover"
                textoConfirmacao="Remove de hábitos/tarefas vinculados:"
                aoConcluir={recarregar}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { removerCategoriaProdutividade } from "./actions";
import { classeCor } from "@/lib/agenda/estilo";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export default async function CategoriasProdutividadePage() {
  const supabase = createClient();

  const { data: categorias } = await supabase
    .from("categorias_produtividade")
    .select("id, nome, cor")
    .order("nome");

  return (
    <main className="max-w-md mx-auto px-6 md:px-12 pt-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold">Categorias</h1>
        <Link
          href="/habitos/categorias/nova"
          className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
        >
          + Nova
        </Link>
      </div>

      {!categorias || categorias.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">Nenhuma categoria ainda</p>
          <p className="text-ink-400 text-sm">
            Categorias funcionam como listas — ex: "Trabalho", "Saúde", "Casa".
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {categorias.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5"
            >
              <span className={`w-3 h-3 rounded-full shrink-0 ${classeCor(cat.cor)}`} />
              <span className="flex-1 text-sm">{cat.nome}</span>
              <BotaoComConfirmacao
                acao={removerCategoriaProdutividade.bind(null, cat.id)}
                textoBotao="Remover"
                textoConfirmacao="Remove de hábitos/tarefas vinculados:"
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

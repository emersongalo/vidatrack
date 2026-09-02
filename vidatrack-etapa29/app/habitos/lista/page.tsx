import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListaHabitosArrastavel } from "@/components/ListaHabitosArrastavel";

export default async function ListaHabitosPage() {
  const supabase = createClient();

  const { data: habitos } = await supabase
    .from("habitos")
    .select("id, nome, cor, icone, frequencia, categorias_produtividade(nome)")
    .eq("arquivado", false)
    .order("ordem", { ascending: true });

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-12 pt-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold">Hábitos</h1>
        <div className="flex items-center gap-3">
          <Link href="/habitos/estatisticas" className="text-ink-400 text-sm hover:text-ink-100 transition">
            Estatísticas
          </Link>
          <Link href="/habitos/lixeira" className="text-ink-400 text-sm hover:text-ink-100 transition">
            Lixeira
          </Link>
          <Link
            href="/habitos/novo"
            className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
          >
            + Novo
          </Link>
        </div>
      </div>

      {!habitos || habitos.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">Nenhum hábito ainda</p>
          <p className="text-ink-400 text-sm">Crie o primeiro na aba "Hoje" ou aqui mesmo.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-ink-400 mb-3">Arraste ⠿ para reordenar</p>
          <ListaHabitosArrastavel habitos={habitos as any} />
        </>
      )}
    </main>
  );
}

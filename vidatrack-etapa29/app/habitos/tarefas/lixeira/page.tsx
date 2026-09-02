import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AcoesLixeiraTarefa } from "@/components/AcoesLixeiraTarefa";

export default async function LixeiraTarefasPage() {
  const supabase = createClient();

  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("id, titulo, icone")
    .eq("arquivada", true)
    .order("criado_em", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-12 pt-2 pb-20">
      <Link href="/habitos/tarefas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Tarefas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Lixeira de tarefas</h1>

      {!tarefas || tarefas.length === 0 ? (
        <p className="text-ink-400 text-sm">Nenhuma tarefa arquivada.</p>
      ) : (
        <ul className="space-y-2">
          {tarefas.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-3"
            >
              <span className="text-lg">{t.icone}</span>
              <span className="flex-1 text-sm truncate">{t.titulo}</span>
              <AcoesLixeiraTarefa tarefaId={t.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

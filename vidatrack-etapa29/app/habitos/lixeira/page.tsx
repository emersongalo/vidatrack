import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AcoesLixeiraHabito } from "@/components/AcoesLixeiraHabito";

export default async function LixeiraHabitosPage() {
  const supabase = createClient();

  const { data: habitos } = await supabase
    .from("habitos")
    .select("id, nome, icone")
    .eq("arquivado", true)
    .order("criado_em", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-12 pt-2 pb-20">
      <Link href="/habitos/lista" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Hábitos
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Lixeira de hábitos</h1>

      {!habitos || habitos.length === 0 ? (
        <p className="text-ink-400 text-sm">Nenhum hábito arquivado.</p>
      ) : (
        <ul className="space-y-2">
          {habitos.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-3"
            >
              <span className="text-lg">{h.icone}</span>
              <span className="flex-1 text-sm truncate">{h.nome}</span>
              <AcoesLixeiraHabito habitoId={h.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AcoesLixeiraNota } from "@/components/AcoesLixeiraNota";

export default async function LixeiraNotasPage() {
  const supabase = createClient();

  const { data: notas } = await supabase
    .from("notas")
    .select("id, titulo")
    .eq("arquivado", true)
    .order("atualizado_em", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-12 pt-6 pb-20">
      <Link href="/notas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Notas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Lixeira de notas</h1>

      {!notas || notas.length === 0 ? (
        <p className="text-ink-400 text-sm">Nenhuma nota arquivada.</p>
      ) : (
        <ul className="space-y-2">
          {notas.map((n) => (
            <li
              key={n.id}
              className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-3"
            >
              <span className="flex-1 text-sm truncate">{n.titulo}</span>
              <AcoesLixeiraNota notaId={n.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

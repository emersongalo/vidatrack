import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AcoesLixeiraConta } from "@/components/AcoesLixeiraConta";

export default async function LixeiraContasPage() {
  const supabase = createClient();

  const { data: contas } = await supabase
    .from("financa_contas")
    .select("id, nome")
    .eq("arquivado", true)
    .order("criado_em", { ascending: false });

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/financas/contas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Contas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Lixeira de contas</h1>

      {!contas || contas.length === 0 ? (
        <p className="text-ink-400 text-sm">Nenhuma conta arquivada.</p>
      ) : (
        <ul className="space-y-2">
          {contas.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3"
            >
              <span className="flex-1 text-sm truncate">{c.nome}</span>
              <AcoesLixeiraConta contaId={c.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

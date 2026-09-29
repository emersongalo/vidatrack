import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Etapa 214 — painel de erros, só pra quem administra o app.
// Os eventos são anônimos (a tabela não guarda quem foi): só a
// mensagem, a tela e a hora — dá pra ver o que está quebrando sem
// olhar dado de ninguém.
const ADMINS = (process.env.ADMIN_EMAILS ?? "emerprojetos@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function PainelErrosPage({ searchParams }: { searchParams: { dias?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMINS.includes((user.email ?? "").toLowerCase())) redirect("/dashboard");

  const dias = [1, 7, 30].includes(Number(searchParams.dias)) ? Number(searchParams.dias) : 7;
  const desde = new Date(Date.now() - dias * 86400000).toISOString();

  const admin = criarClienteAdmin("painel_erros", "Tela /admin/erros: erros anônimos de formulário/app");
  const { data: eventos } = await admin
    .from("analytics_eventos")
    .select("pagina, criado_em")
    .ilike("pagina", "erro%")
    .gte("criado_em", desde)
    .order("criado_em", { ascending: false })
    .limit(1000);

  // agrupa pela mensagem (sem a parte variável depois de ":", quando dá)
  const grupos = new Map<string, { total: number; ultimo: string; exemplo: string }>();
  for (const e of eventos ?? []) {
    const chave = String(e.pagina).slice(0, 120);
    const g = grupos.get(chave) ?? { total: 0, ultimo: e.criado_em as string, exemplo: String(e.pagina) };
    g.total++;
    if ((e.criado_em as string) > g.ultimo) g.ultimo = e.criado_em as string;
    grupos.set(chave, g);
  }
  const lista = [...grupos.entries()].sort((a, b) => b[1].total - a[1].total);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/dashboard" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Painel
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Painel de erros</h1>
      <p className="text-ink-400 text-sm mb-5">
        Erros que apareceram pra alguém no app (anônimos). {eventos?.length ?? 0} no período.
      </p>

      <div className="flex gap-2 mb-5">
        {[1, 7, 30].map((d) => (
          <Link
            key={d}
            href={`/admin/erros?dias=${d}`}
            className={`text-sm rounded-full px-3.5 py-1.5 border transition ${
              d === dias ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {d === 1 ? "24 horas" : `${d} dias`}
          </Link>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-medium">Nenhum erro nesse período</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {lista.map(([chave, g]) => (
            <li key={chave} className="bg-base-800 border border-base-600 rounded-2xl p-4 flex items-start gap-3">
              <span className="font-mono text-sm bg-red-400/15 text-red-400 rounded-md px-2 py-0.5 shrink-0">{g.total}×</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm break-words">{g.exemplo}</p>
                <p className="text-xs text-ink-400 mt-1">
                  Último: {new Date(g.ultimo).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

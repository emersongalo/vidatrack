import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { agruparErros, type OrigemErro } from "@/lib/app/erros";

export const dynamic = "force-dynamic";

// Etapa 214 — painel de erros, só pra quem administra o app.
// Os eventos são anônimos (a tabela não guarda quem foi): só a
// mensagem, a tela e a hora — dá pra ver o que está quebrando sem
// olhar dado de ninguém.
const ADMINS = (process.env.ADMIN_EMAILS ?? "emerprojetos@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ORIGENS: { valor: OrigemErro | "todas"; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todos" },
  { valor: "js", rotulo: "Tela (JS)" },
  { valor: "promise", rotulo: "Ação" },
  { valor: "http", rotulo: "Servidor" },
];

export default async function PainelErrosPage({ searchParams }: { searchParams: { dias?: string; origem?: string } }) {
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

  // Etapa 280 — agrupa erros parecidos (sem ids/números), marca os novos
  const origem = (ORIGENS.find((o) => o.valor === searchParams.origem)?.valor ?? "todas") as OrigemErro | "todas";
  const todos = agruparErros((eventos ?? []) as { pagina: string; criado_em: string }[]);
  const lista = origem === "todas" ? todos : todos.filter((g) => g.origem === origem);
  const umDia = new Date(Date.now() - 86400000).toISOString();
  const doisDias = new Date(Date.now() - 2 * 86400000).toISOString();
  const hoje = (eventos ?? []).filter((e) => (e.criado_em as string) >= umDia).length;
  const ontem = (eventos ?? []).filter((e) => (e.criado_em as string) >= doisDias && (e.criado_em as string) < umDia).length;
  const porTela = new Map<string, number>();
  for (const g of todos) porTela.set(g.tela, (porTela.get(g.tela) ?? 0) + g.total);
  const telas = [...porTela.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const link = (d: number, o: string) => `/admin/erros?dias=${d}${o !== "todas" ? `&origem=${o}` : ""}`;

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/dashboard" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Painel
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Painel de erros</h1>
      <p className="text-ink-400 text-sm mb-5">
        Erros que apareceram pra alguém no app (anônimos). {eventos?.length ?? 0} no período.
      </p>

      {/* Etapa 280 — últimas 24h x dia anterior e telas com mais erros */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-base-800 border border-base-600 rounded-2xl p-4">
          <p className="text-xs text-ink-400">Últimas 24h</p>
          <p className="text-2xl font-semibold">{hoje}</p>
          <p className={`text-xs ${hoje > ontem ? "text-red-400" : "text-habito"}`}>
            {hoje === ontem ? "igual ao dia anterior" : hoje > ontem ? `▲ ${hoje - ontem} a mais que ontem` : `▼ ${ontem - hoje} a menos que ontem`}
          </p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-2xl p-4">
          <p className="text-xs text-ink-400 mb-1">Telas com mais erros</p>
          {telas.length === 0 ? (
            <p className="text-sm">—</p>
          ) : (
            telas.map(([t, n]) => (
              <p key={t} className="text-xs truncate">
                <span className="font-mono text-red-400">{n}×</span> {t}
              </p>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {[1, 7, 30].map((d) => (
          <Link
            key={d}
            href={link(d, origem)}
            className={`text-sm rounded-full px-3.5 py-1.5 border transition ${
              d === dias ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {d === 1 ? "24 horas" : `${d} dias`}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none">
        {ORIGENS.map((o) => (
          <Link
            key={o.valor}
            href={link(dias, o.valor)}
            className={`shrink-0 text-xs rounded-full px-3 py-1.5 border transition ${
              o.valor === origem ? "border-red-400 text-red-400 bg-red-400/10" : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {o.rotulo}
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
          {lista.map((g) => (
            <li key={g.chave} className="bg-base-800 border border-base-600 rounded-2xl p-4 flex items-start gap-3">
              <span className="font-mono text-sm bg-red-400/15 text-red-400 rounded-md px-2 py-0.5 shrink-0">{g.total}×</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm break-words">
                  {g.primeiro >= umDia && (
                    <span className="mr-1.5 text-[10px] font-bold uppercase rounded bg-financa text-base-900 px-1.5 py-0.5 align-middle">novo</span>
                  )}
                  {g.exemplo}
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  Último: {new Date(g.ultimo).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  {g.app + g.web > 0 && ` · 📱 ${g.app} app · 🌐 ${g.web} web`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

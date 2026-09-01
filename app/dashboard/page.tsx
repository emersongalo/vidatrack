import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { sair } from "../login/actions";
import { AlternadorTema } from "@/components/AlternadorTema";
import { hojeISO } from "@/lib/habitos/streak";
import { buscarItensDoDia } from "@/lib/agenda/consulta";
import { buscarSaldoTotal, buscarContasAPagar } from "@/lib/financas/consulta";
import { buscarPrevisaoTempo } from "@/lib/clima/consulta";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { WidgetClima } from "@/components/WidgetClima";
import { MiniCalendario } from "@/components/MiniCalendario";
import { DefinirLocalizacao } from "@/components/DefinirLocalizacao";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nome = (user?.user_metadata?.nome as string) || user?.email || "";

  const [{ data: perfil }, { itens: itensHoje }, saldoTotal, contasAPagar] = await Promise.all([
    supabase.from("perfis").select("latitude, longitude, local_nome").eq("id", user?.id ?? "").maybeSingle(),
    buscarItensDoDia(hojeISO(), ""),
    buscarSaldoTotal(supabase),
    buscarContasAPagar(supabase, 4),
  ]);

  const previsao =
    perfil?.latitude && perfil?.longitude
      ? await buscarPrevisaoTempo(Number(perfil.latitude), Number(perfil.longitude))
      : null;

  const habitos = itensHoje.filter((i) => i.tipo === "habito");
  const tarefas = itensHoje.filter((i) => i.tipo === "tarefa");
  const habitosFeitos = habitos.filter((h) => h.feito).length;
  const tarefasFeitas = tarefas.filter((t) => t.feito).length;

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-8 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-lg shrink-0" />
          <div className="min-w-0">
            <p className="text-ink-400 text-xs">Olá,</p>
            <h1 className="text-lg md:text-2xl font-display font-semibold truncate">{nome}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/notificacoes"
            aria-label="Notificações"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-800 transition"
          >
            🔔
          </Link>
          <AlternadorTema />
          <form action={sair}>
            <button
              aria-label="Sair"
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-800 transition"
            >
              ⏻
            </button>
          </form>
        </div>
      </header>

      {/* Clima + calendário */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {previsao ? (
          <WidgetClima previsao={previsao} localNome={perfil?.local_nome ?? ""} />
        ) : (
          <DefinirLocalizacao />
        )}
        <MiniCalendario />
      </div>

      {/* Resumo de hoje */}
      <Link
        href="/habitos"
        className="flex items-center gap-4 bg-base-800 border border-base-600 border-l-4 border-l-habito rounded-xl2 p-4 mb-3 hover:border-habito transition"
      >
        <span className="w-11 h-11 rounded-xl bg-habito/15 flex items-center justify-center text-xl shrink-0">
          🔁
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold">Hoje</p>
            <span className="text-xs text-ink-400 shrink-0">Ver agenda →</span>
          </div>
          <div className="flex gap-5 mt-1">
            <p className="text-sm text-ink-400">
              <span className="font-mono text-ink-100 font-semibold">{habitosFeitos}/{habitos.length}</span> hábitos
            </p>
            <p className="text-sm text-ink-400">
              <span className="font-mono text-ink-100 font-semibold">{tarefasFeitas}/{tarefas.length}</span> tarefas
            </p>
          </div>
        </div>
      </Link>

      {/* Resumo financeiro */}
      <Link
        href="/financas"
        className="flex items-start gap-4 bg-base-800 border border-base-600 border-l-4 border-l-financa rounded-xl2 p-4 mb-8 hover:border-financa transition"
      >
        <span className="w-11 h-11 rounded-xl bg-financa/15 flex items-center justify-center text-xl shrink-0">
          💰
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold">Finanças</p>
            <span className="text-xs text-ink-400 shrink-0">Ver tudo →</span>
          </div>
          <p className="text-xl font-mono font-semibold mt-1">{formatarMoeda(saldoTotal)}</p>
          {contasAPagar.length > 0 && (
            <ul className="space-y-1 mt-2">
              {contasAPagar.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-xs">
                  <span className="truncate text-ink-400">{c.descricao}</span>
                  <span className="font-mono text-ink-400 shrink-0 ml-3">
                    dia {c.diaMes} · {formatarMoeda(c.valor)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>

      {/* Acesso rápido — tiles compactos e uniformes de propósito, pra
          não competir visualmente com os cards de resumo acima */}
      <p className="text-xs text-ink-400 mb-2 uppercase tracking-wide">Acesso rápido</p>
      <div className="grid grid-cols-3 gap-3">
        <AcessoRapido href="/habitos/lista" cor="habito" icone="🔁" titulo="Hábitos" />
        <AcessoRapido href="/notas" cor="nota" icone="📝" titulo="Notas" />
        <AcessoRapido href="/financas" cor="financa" icone="💰" titulo="Finanças" />
      </div>

      <p className="text-center mt-10 flex items-center justify-center gap-4">
        <Link href="/doacao" className="text-xs text-ink-400 hover:text-ink-100 transition">
          💛 Apoiar o projeto
        </Link>
        <Link href="/privacidade" className="text-xs text-ink-400 hover:text-ink-100 transition">
          Privacidade
        </Link>
      </p>
    </main>
  );
}

function AcessoRapido({
  href,
  cor,
  icone,
  titulo,
}: {
  href: string;
  cor: "habito" | "nota" | "financa";
  icone: string;
  titulo: string;
}) {
  const bordas = {
    habito: "hover:border-habito",
    nota: "hover:border-nota",
    financa: "hover:border-financa",
  };
  const fundos = {
    habito: "bg-habito/15",
    nota: "bg-nota/15",
    financa: "bg-financa/15",
  };
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-2 aspect-square bg-base-800 border border-base-600 rounded-xl2 transition ${bordas[cor]}`}
    >
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${fundos[cor]}`}>
        {icone}
      </span>
      <p className="font-display font-medium text-sm">{titulo}</p>
    </Link>
  );
}

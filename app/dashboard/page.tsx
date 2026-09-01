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
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-lg" />
          <div>
            <p className="text-ink-400 text-sm">Olá,</p>
            <h1 className="text-2xl font-display font-semibold">{nome}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/notificacoes" className="text-sm text-ink-400 hover:text-ink-100 transition">
            Notificações
          </Link>
          <AlternadorTema />
          <form action={sair}>
            <button className="text-sm text-ink-400 hover:text-ink-100 transition">
              Sair
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
        className="block bg-base-800 border border-base-600 border-l-4 border-l-habito rounded-xl2 p-4 mb-4 hover:border-habito transition"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="font-display font-semibold">Hoje</p>
          <span className="text-xs text-ink-400">Ver agenda →</span>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-mono font-semibold">
              {habitosFeitos}
              <span className="text-ink-400 text-base">/{habitos.length}</span>
            </p>
            <p className="text-xs text-ink-400">hábitos feitos</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-semibold">
              {tarefasFeitas}
              <span className="text-ink-400 text-base">/{tarefas.length}</span>
            </p>
            <p className="text-xs text-ink-400">tarefas feitas</p>
          </div>
        </div>
      </Link>

      {/* Resumo financeiro */}
      <Link
        href="/financas"
        className="block bg-base-800 border border-base-600 border-l-4 border-l-financa rounded-xl2 p-4 mb-8 hover:border-financa transition"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-semibold">Finanças</p>
          <span className="text-xs text-ink-400">Ver tudo →</span>
        </div>
        <p className="text-2xl font-mono font-semibold mb-3">{formatarMoeda(saldoTotal)}</p>
        {contasAPagar.length > 0 && (
          <div>
            <p className="text-xs text-ink-400 mb-1.5">A pagar em breve</p>
            <ul className="space-y-1">
              {contasAPagar.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{c.descricao}</span>
                  <span className="font-mono text-ink-400 shrink-0 ml-3">
                    dia {c.diaMes} · {formatarMoeda(c.valor)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Link>

      {/* Acesso rápido aos módulos */}
      <div className="grid sm:grid-cols-3 gap-4">
        <ModuloCard
          href="/habitos"
          cor="habito"
          titulo="Hábitos"
          descricao="Acompanhe sua constância dia a dia."
        />
        <ModuloCard
          href="/notas"
          cor="nota"
          titulo="Notas"
          descricao="Organize ideias em páginas e blocos."
        />
        <ModuloCard
          href="/financas"
          cor="financa"
          titulo="Finanças"
          descricao="Controle contas, gastos e orçamento."
        />
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

function ModuloCard({
  href,
  cor,
  titulo,
  descricao,
}: {
  href: string;
  cor: "habito" | "nota" | "financa";
  titulo: string;
  descricao: string;
}) {
  const bordas = {
    habito: "hover:border-habito",
    nota: "hover:border-nota",
    financa: "hover:border-financa",
  };
  const pontos = {
    habito: "bg-habito",
    nota: "bg-nota",
    financa: "bg-financa",
  };
  return (
    <Link
      href={href}
      className={`block bg-base-800 border border-base-600 rounded-xl2 p-5 transition ${bordas[cor]}`}
    >
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${pontos[cor]} mb-4`} />
      <p className="font-display font-semibold text-lg">{titulo}</p>
      <p className="text-ink-400 text-sm mt-1">{descricao}</p>
    </Link>
  );
}

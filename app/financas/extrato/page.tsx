import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatarMoeda,
  calcularPeriodo,
  type PresetPeriodo,
} from "@/lib/financas/formatacao";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { BotaoRemoverTransacao } from "@/components/BotaoRemoverTransacao";

const PRESETS: { valor: PresetPeriodo; rotulo: string }[] = [
  { valor: "este_mes", rotulo: "Este mês" },
  { valor: "mes_passado", rotulo: "Mês passado" },
  { valor: "ultimos_30", rotulo: "Últimos 30 dias" },
  { valor: "este_ano", rotulo: "Este ano" },
  { valor: "tudo", rotulo: "Tudo" },
];

export default async function ExtratoPage({
  searchParams,
}: {
  searchParams: { tipo?: string; inicio?: string; fim?: string; preset?: string; contaId?: string };
}) {
  const supabase = createClient();

  const presetAtivo = (searchParams.preset as PresetPeriodo) ?? (searchParams.inicio ? "" : "este_mes");
  const periodoPreset = presetAtivo ? calcularPeriodo(presetAtivo as PresetPeriodo) : null;
  const inicio = searchParams.inicio ?? periodoPreset?.inicio ?? calcularPeriodo("este_mes").inicio;
  const fim = searchParams.fim ?? periodoPreset?.fim ?? calcularPeriodo("este_mes").fim;
  const tipo = searchParams.tipo ?? "todos";

  const { data: contas } = await supabase
    .from("financa_contas")
    .select("id, nome")
    .eq("arquivado", false);
  const idsContas = (contas ?? []).map((c) => c.id);
  const mapaContas = new Map((contas ?? []).map((c) => [c.id, c.nome]));

  let consulta = supabase
    .from("financa_transacoes")
    .select("id, conta_id, categoria_id, tipo, valor, descricao, data, financa_categorias(icone, cor)")
    .in("conta_id", idsContas.length ? idsContas : ["00000000-0000-0000-0000-000000000000"])
    .gte("data", inicio)
    .lte("data", fim)
    .order("data", { ascending: false });

  if (searchParams.contaId) consulta = consulta.eq("conta_id", searchParams.contaId);
  if (tipo !== "todos") consulta = consulta.eq("tipo", tipo);

  const { data: transacoes } = await consulta;
  const lista = transacoes ?? [];

  const totalReceitas = lista.filter((t) => t.tipo === "receita").reduce((a, t) => a + t.valor, 0);
  const totalDespesas = lista.filter((t) => t.tipo === "despesa").reduce((a, t) => a + t.valor, 0);

  function linkComFiltro(mudancas: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const atual = {
      tipo,
      preset: presetAtivo || undefined,
      inicio: searchParams.inicio,
      fim: searchParams.fim,
      contaId: searchParams.contaId,
    };
    const combinado = { ...atual, ...mudancas };
    Object.entries(combinado).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return `/financas/extrato?${params.toString()}`;
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-5">Extrato</h1>

      {/* Filtro de tipo */}
      <div className="flex gap-2 mb-3">
        {[
          { valor: "todos", rotulo: "Todos" },
          { valor: "receita", rotulo: "Receitas" },
          { valor: "despesa", rotulo: "Despesas" },
        ].map((opcao) => (
          <Link
            key={opcao.valor}
            href={linkComFiltro({ tipo: opcao.valor })}
            className={`text-sm rounded-full px-3.5 py-1.5 border transition ${
              tipo === opcao.valor
                ? "bg-ink-100 text-base-900 border-ink-100"
                : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {opcao.rotulo}
          </Link>
        ))}
      </div>

      {/* Presets de período */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
        {PRESETS.map((p) => (
          <Link
            key={p.valor}
            href={linkComFiltro({ preset: p.valor, inicio: undefined, fim: undefined })}
            className={`shrink-0 text-xs rounded-full px-3 py-1.5 border transition ${
              presetAtivo === p.valor
                ? "bg-financa/20 border-financa text-financa"
                : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {p.rotulo}
          </Link>
        ))}
      </div>

      {/* Período customizado */}
      <form method="get" className="flex items-end gap-2 mb-6">
        <input type="hidden" name="tipo" value={tipo} />
        <div className="flex-1">
          <label className="block text-[11px] text-ink-400 mb-1">De</label>
          <input
            type="date"
            name="inicio"
            defaultValue={inicio}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-2.5 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] text-ink-400 mb-1">Até</label>
          <input
            type="date"
            name="fim"
            defaultValue={fim}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-2.5 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>
        <button
          type="submit"
          className="text-sm border border-base-600 rounded-lg px-3 py-2 hover:bg-base-800 transition shrink-0"
        >
          Filtrar
        </button>
      </form>

      {/* Resumo do período filtrado */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-3">
          <p className="text-ink-400 text-xs mb-1">Receitas no período</p>
          <p className="font-mono font-medium text-habito">{formatarMoeda(totalReceitas)}</p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-3">
          <p className="text-ink-400 text-xs mb-1">Despesas no período</p>
          <p className="font-mono font-medium text-red-400">{formatarMoeda(totalDespesas)}</p>
        </div>
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <p className="text-ink-400 text-sm">Nenhum lançamento nesse período.</p>
      ) : (
        <ul className="space-y-2">
          {lista.map((t: any) => (
            <li
              key={t.id}
              className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3"
            >
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(
                  t.financa_categorias?.cor ?? "financa"
                )}`}
              >
                {t.financa_categorias?.icone ?? (t.tipo === "receita" ? "💰" : "💸")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{t.descricao || mapaContas.get(t.conta_id)}</p>
                <p className="text-xs text-ink-400">
                  {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                  {mapaContas.get(t.conta_id)}
                </p>
              </div>
              <span
                className={`font-mono text-sm shrink-0 ${
                  t.tipo === "receita" ? "text-habito" : "text-red-400"
                }`}
              >
                {t.tipo === "receita" ? "+" : "-"}
                {formatarMoeda(t.valor)}
              </span>
              <Link
                href={`/financas/${t.id}/editar`}
                className="text-ink-400 hover:text-ink-100 transition text-xs shrink-0"
              >
                Editar
              </Link>
              <BotaoRemoverTransacao transacaoId={t.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

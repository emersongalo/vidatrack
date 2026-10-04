"use client";

// Etapa 254 — detalhe de uma recorrência: ajustar só este mês, editar
// daqui pra frente (sem mexer no que já foi pago) e ver o histórico.
import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarClock, History, Pencil } from "lucide-react";
import { FormularioAcao } from "@/components/FormularioAcao";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { CarregandoTela } from "@/components/Esqueleto";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { hojeISO } from "@/lib/habitos/streak";
import { atualizarRecorrencia } from "../actions";

const campo =
  "w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition";

function ddmmaa(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function RecorrenciaPage() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}

function Conteudo() {
  const params = useParams<{ id: string }>();
  const { snapshot, recarregar } = useSnapshotOffline();
  const [tipoEditado, setTipoEditado] = useState<string | null>(null);
  if (snapshot === undefined) return <CarregandoTela comTopo={false} linhas={4} />;

  const r = (snapshot?.financas.recorrencias ?? []).find((x: any) => x.id === params.id) as any;
  if (!r) {
    return (
      <main className="min-h-screen p-6 md:p-12 pagina-curta">
        <Link href="/financas/recorrentes" className="text-ink-400 text-base">← Recorrentes</Link>
        <p className="text-ink-400 text-sm mt-6">Não encontrei essa recorrência no que está salvo no aparelho.</p>
      </main>
    );
  }

  const hoje = hojeISO();
  const mes = hoje.slice(0, 7);
  const contas = (snapshot?.financas.contas ?? []) as any[];
  const categorias = ((snapshot?.financas.categorias ?? []) as any[]).filter((c) => c.dono_id === snapshot?.perfil.id);
  const nomeConta = (id: string) => contas.find((c) => c.id === id)?.nome ?? "";
  const lancamentos = ((snapshot?.financas.transacoes ?? []) as any[])
    .filter((t) => t.recorrencia_id === r.id)
    .sort((a, b) => b.data.localeCompare(a.data));
  const desteMes = lancamentos.find((t) => t.data.startsWith(mes)) ?? null;
  const anteriores = lancamentos.filter((t) => t !== desteMes).slice(0, 12);
  const pago = (t: any) => !!t.pago_em || t.data <= hoje;
  const nome = r.descricao || nomeConta(r.conta_id) || "Recorrência";
  const cor = r.tipo === "receita" ? "text-habito" : "text-red-400";

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-curta pb-16">
      <Link href="/financas/recorrentes" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Recorrentes
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1 truncate">{nome}</h1>
      <p className="text-ink-400 text-sm mb-6">
        ↻ Todo dia {r.dia_mes} · {nomeConta(r.conta_id)} · <span className={`font-mono ${cor}`}>{formatarMoeda(r.valor)}</span>
        {!r.ativo && " · pausada"}
      </p>

      {/* Este mês */}
      <section className="bg-base-800 border border-base-600 rounded-3xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CalendarClock size={18} className="text-financa" />
          <h2 className="text-lg font-semibold">Este mês</h2>
        </div>
        {desteMes ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-ink-400">
                {ddmmaa(desteMes.data)} ·{" "}
                {pago(desteMes) ? <span className="text-habito">Pago</span> : <span className="text-financa">A pagar</span>}
              </p>
              <p className={`text-2xl font-display font-bold font-mono ${cor}`}>{formatarMoeda(desteMes.valor)}</p>
            </div>
            {Number(desteMes.valor) !== Number(r.valor) && (
              <p className="text-xs text-ink-400 mt-1">Ajustado neste mês (o normal é {formatarMoeda(r.valor)}).</p>
            )}
            <Link
              href={`/financas/${desteMes.id}/editar`}
              className="mt-4 flex items-center justify-center gap-2 w-full bg-financa text-base-900 rounded-2xl py-3 font-semibold"
            >
              <Pencil size={16} /> Ajustar só este mês
            </Link>
            <p className="text-xs text-ink-400 mt-2">Muda o valor, a data ou a conta só deste mês. Os outros meses continuam iguais.</p>
          </>
        ) : (
          <p className="text-sm text-ink-400">
            {r.ativo
              ? "O lançamento deste mês aparece quando você abrir Finanças (com internet)."
              : "Pausada — não gera lançamento enquanto estiver assim."}
          </p>
        )}
      </section>

      {/* Editar daqui pra frente */}
      <section className="bg-base-800 border border-base-600 rounded-3xl p-5 mb-6">
        <h2 className="text-lg font-semibold mb-1">Editar daqui pra frente</h2>
        <p className="text-xs text-ink-400 mb-4">
          Vale pros próximos meses e pro que ainda está a pagar. O que já foi pago nos meses anteriores não muda.
        </p>
        <FormularioAcao
          acao={atualizarRecorrencia.bind(null, r.id)}
          aoSucesso={recarregar}
          mensagemSucesso="Recorrência atualizada!"
          limparAoSalvar={false}
          className="space-y-3"
        >
          <select name="tipo" value={tipoEditado ?? r.tipo} onChange={(e) => setTipoEditado(e.target.value)} className={campo}>
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
          <div>
            <label className="block text-sm text-ink-400 mb-1">Valor</label>
            <CampoValorMonetario name="valor" valorInicial={Number(r.valor)} required className={`${campo} font-mono`} />
          </div>
          <input name="descricao" defaultValue={r.descricao ?? ""} placeholder="Descrição (ex: Aluguel)" className={campo} />
          <select name="contaId" defaultValue={r.conta_id} className={campo}>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <select name="categoriaId" defaultValue={r.categoria_id ?? ""} className={campo}>
            <option value="">Sem categoria</option>
            {categorias.filter((c) => !c.tipo || c.tipo === (tipoEditado ?? r.tipo)).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-ink-400 mb-1">Todo dia (1 a 28)</label>
              <input name="diaMes" type="number" min={1} max={28} defaultValue={r.dia_mes} className={`${campo} font-mono`} />
            </div>
            <div>
              <label className="block text-sm text-ink-400 mb-1">Até (opcional)</label>
              <input name="dataFim" type="date" defaultValue={r.data_fim ?? ""} className={campo} />
            </div>
          </div>
          <BotaoSalvarFormulario>Salvar daqui pra frente</BotaoSalvarFormulario>
        </FormularioAcao>
      </section>

      {/* Histórico */}
      {anteriores.length > 0 && (
        <section className="bg-base-800 border border-base-600 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <History size={18} className="text-ink-400" />
            <h2 className="text-lg font-semibold">Meses anteriores</h2>
          </div>
          <ul className="divide-y divide-base-600">
            {anteriores.map((t) => (
              <li key={t.id}>
                <Link href={`/financas/${t.id}/editar`} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink-400">
                    {ddmmaa(t.data)} · {pago(t) ? "Pago" : "A pagar"}
                  </span>
                  <span className={`font-mono ${cor}`}>{formatarMoeda(t.valor)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-400 mt-2">Esses valores ficam como foram — editar a recorrência não muda o passado.</p>
        </section>
      )}
    </main>
  );
}

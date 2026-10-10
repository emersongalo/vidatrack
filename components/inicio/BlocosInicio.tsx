"use client";

// Etapa 235 — o miolo do Início: monta os blocos na ordem que a pessoa
// escolheu (salva na conta, com cópia neste aparelho pra abrir na hora).
import { useEffect, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { CHAVE_INICIO, lerBlocosInicio, type IdBloco } from "@/lib/painel/blocos";
import { resumoDoDia } from "@/lib/painel/seuDia";
import type { ResumoDia } from "@/lib/painel/seuDia";
import { JuntosPainel } from "@/components/JuntosPainel";
import { ProximosPainel } from "@/components/ProximosPainel";
import { PainelCartoes } from "@/components/PainelCartoes";
import { CaixaAssistente } from "@/components/CaixaAssistente";
import { DiarioDoDia } from "@/components/DiarioDoDia";
import { MetasResumo } from "@/components/MetasResumo";
import { ListaContasComSaldo } from "@/components/ListaContasComSaldo";
import { PodeGastarHoje } from "@/components/PodeGastarHoje";
import { GastosRapidos } from "@/components/GastosRapidos";
import { ConfirmarReceitas } from "@/components/ConfirmarReceitas";
import { PersonalizarInicio } from "@/components/inicio/PersonalizarInicio";
import {
  CartaoInicio,
  CategoriasInicio,
  GastosSemanaInicio,
  SaldoInicio,
  SemanaHabitosInicio,
  SequenciasInicio,
  TetoInicio,
} from "@/components/inicio/Widgets";

function lerLocal(): IdBloco[] | null {
  try {
    const b = localStorage.getItem(CHAVE_INICIO);
    return b ? lerBlocosInicio(b) : null;
  } catch {
    return null;
  }
}

export function BlocosInicio({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const [lista, setLista] = useState<IdBloco[] | null>(null);
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // conta (retrato) > aparelho > padrão
  const daConta = snapshot?.perfil?.ordem_blocos_inicio as string[] | null | undefined;
  useEffect(() => {
    if (daConta && daConta.length) setLista(lerBlocosInicio(daConta));
    else setLista((atual) => atual ?? lerLocal() ?? lerBlocosInicio(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(daConta ?? null)]);

  async function salvar(nova: IdBloco[]) {
    setErro(null);
    setLista(nova);
    try {
      localStorage.setItem(CHAVE_INICIO, JSON.stringify(nova));
    } catch {}
    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getSession();
    const eu = sessao.session?.user.id;
    if (!eu) return;
    const { error } = await supabase.from("perfis").update({ ordem_blocos_inicio: nova }).eq("id", eu);
    if (error) setErro("Ficou salvo só neste aparelho (sem internet?)");
    else atualizarSnapshotEmTodasAsTelas();
  }

  if (!snapshot || !lista) return null;

  const contas = (snapshot.financas?.contas ?? []) as any[];
  const cartoes = contas.filter((c) => c.tipo === "cartao");
  const metasAtivas = ((snapshot.financas?.metas ?? []) as any[]).filter((m) => !m.concluida && !m.arquivada);
  const resumoHoje = resumoDoDia(snapshot, hoje);

  const blocos: Record<IdBloco, React.ReactNode> = {
    // Etapa 287 — o anel do dia foi pro topo; aqui fica o que falta, com um toque pra abrir
    seuDia: <PraFazer resumo={resumoHoje} />,
    juntos: <JuntosPainel snapshot={snapshot} hoje={hoje} />,
    sequencias: <SequenciasInicio s={snapshot} hoje={hoje} />,
    semanaHabitos: <SemanaHabitosInicio s={snapshot} hoje={hoje} />,
    humor: <DiarioDoDia snapshot={snapshot} dataISO={hoje} hojeISO={hoje} />,
    saldo: contas.length ? (
      <SaldoInicio s={snapshot} hoje={hoje} />
    ) : (
      <CartaoInicio titulo="Saldo">
        <p className="text-base text-ink-400">Adicione sua conta ou carteira pra ver o saldo aqui.</p>
        <Link href="/financas/contas" className="inline-block mt-3 bg-financa text-base-900 rounded-xl px-4 py-2.5 text-base font-semibold">
          Adicionar conta
        </Link>
      </CartaoInicio>
    ),
    // Etapa 247
    podeGastar: <PodeGastarHoje snapshot={snapshot} hojeISO={hoje} noInicio />,
    lancarRapido: <GastosRapidos snapshot={snapshot} hojeISO={hoje} noInicio />,
    gastosSemana: <GastosSemanaInicio s={snapshot} hoje={hoje} />,
    teto: <TetoInicio s={snapshot} hoje={hoje} />,
    categorias: <CategoriasInicio s={snapshot} hoje={hoje} />,
    faturas: cartoes.length ? (
      <ListaContasComSaldo contas={cartoes} transacoes={snapshot.financas?.transacoes ?? []} />
    ) : (
      <CartaoInicio titulo="Cartões">
        <p className="text-base text-ink-400">Cadastre um cartão de crédito pra ver fatura e limite aqui.</p>
        <Link href="/financas/contas" className="inline-block mt-3 bg-financa text-base-900 rounded-xl px-4 py-2.5 text-base font-semibold">
          Adicionar cartão
        </Link>
      </CartaoInicio>
    ),
    metasFinanceiras: metasAtivas.length ? (
      <MetasResumo metas={metasAtivas} hojeISO={hoje} />
    ) : (
      <CartaoInicio titulo="Metas de economia">
        <p className="text-base text-ink-400">Crie uma meta (viagem, reserva…) e acompanhe o anel enchendo.</p>
        <Link href="/financas/metas" className="inline-block mt-3 bg-financa text-base-900 rounded-xl px-4 py-2.5 text-base font-semibold">
          Criar meta
        </Link>
      </CartaoInicio>
    ),
    proximos: <ProximosPainel snapshot={snapshot} hoje={hoje} />,
    resumo: <PainelCartoes />,
    assistente: <CaixaAssistente />,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3 mt-2">
        <h2 className="text-lg font-display font-semibold">Seu painel</h2>
        <button
          type="button"
          onClick={() => setEditando(true)}
          aria-label="Personalizar Início"
          className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100 rounded-full bg-base-800 border border-base-600 px-3 py-1.5"
        >
          <SlidersHorizontal size={15} /> Organizar
        </button>
      </div>
      {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}
      {/* Etapa 268 — receita programada esperando confirmação aparece no topo do Início */}
      <div className="mb-6 empty:hidden">
        <ConfirmarReceitas snapshot={snapshot} noInicio />
      </div>

      {lista.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="w-full text-base text-ink-400 border border-dashed border-base-600 rounded-3xl p-8"
        >
          Seu Início está vazio — toque pra escolher o que ver
        </button>
      ) : (
        <div className="lg:columns-2 lg:gap-6">
          {lista.map((id, i) => (
            <div
              key={id}
              className="mb-5 break-inside-avoid animate-entrar empty:hidden [&>*]:!mb-0"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              {blocos[id]}
            </div>
          ))}
        </div>
      )}

      {editando && <PersonalizarInicio inicial={lista} aoSalvar={salvar} aoFechar={() => setEditando(false)} />}
    </>
  );
}

/** Etapa 287 — "Pra fazer hoje": os nomes do que falta, em chips. */
function PraFazer({ resumo }: { resumo: ResumoDia }) {
  const pendH = resumo.habitos.pendentes;
  const pendT = resumo.tarefas.pendentes;
  if (!pendH.length && !pendT.length) return null;
  return (
    <div className="bg-base-800 border border-base-600 rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-base font-semibold">Pra fazer hoje</p>
        <span className="text-xs text-ink-400">{pendH.length + pendT.length} no total</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {pendH.slice(0, 5).map((nome, i) => (
          <Link key={`h${i}`} href="/habitos" className="text-sm rounded-full px-3 py-1.5 bg-habito/10 text-habito border border-habito/25 max-w-full truncate">
            {nome}
          </Link>
        ))}
        {pendT.slice(0, 5).map((nome, i) => (
          <Link key={`t${i}`} href="/tarefas" className="text-sm rounded-full px-3 py-1.5 bg-nota/10 text-nota border border-nota/25 max-w-full truncate">
            {nome}
          </Link>
        ))}
        {pendH.length + pendT.length > 10 && <span className="text-sm text-ink-400 px-1 py-1.5">+{pendH.length + pendT.length - 10}</span>}
      </div>
    </div>
  );
}

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
import { SeuDia } from "@/components/SeuDia";
import { JuntosPainel } from "@/components/JuntosPainel";
import { ProximosPainel } from "@/components/ProximosPainel";
import { PainelCartoes } from "@/components/PainelCartoes";
import { CaixaAssistente } from "@/components/CaixaAssistente";
import { DiarioDoDia } from "@/components/DiarioDoDia";
import { MetasResumo } from "@/components/MetasResumo";
import { ListaContasComSaldo } from "@/components/ListaContasComSaldo";
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
    seuDia: <SeuDia resumo={resumoHoje} />,
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
      <div className="flex items-center justify-end mb-2">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100 rounded-full border border-base-600 px-3 py-1.5"
        >
          <SlidersHorizontal size={15} /> Personalizar Início
        </button>
      </div>
      {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}

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
          {lista.map((id) => (
            <div key={id} className="mb-6 break-inside-avoid animate-surgir [&>*]:!mb-0">
              {blocos[id]}
            </div>
          ))}
        </div>
      )}

      {editando && <PersonalizarInicio inicial={lista} aoSalvar={salvar} aoFechar={() => setEditando(false)} />}
    </>
  );
}

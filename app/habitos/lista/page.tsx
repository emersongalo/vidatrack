"use client";

import { EstadoVazio } from "@/components/EstadoVazio";
import { Esqueleto } from "@/components/Esqueleto";
import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { ListaHabitosArrastavel } from "@/components/ListaHabitosArrastavel";
import { BotaoNovoHabitoOffline } from "@/components/BotaoNovoHabitoOffline";
import { calcularStreak, calcularMelhorStreak, calcularStreakNegativo, hojeISO } from "@/lib/habitos/streak";
import { ultimosDias } from "@/lib/habitos/detalhe";
import { pausasDe } from "@/lib/habitos/pausa";
import { ModoFerias } from "@/components/ControlePausa";
import { TopoArea } from "@/components/TopoArea";

// Etapa 127: lê do mesmo retrato local usado pelas outras telas —
// abre com o que já tinha salvo, atualiza sozinha se houver internet.
export default function ListaHabitosPage() {
  const { snapshot, recarregar } = useSnapshotOffline();

  return (
    <main className="pagina px-6 md:px-12 pt-2">
      {/* Etapa 279 — topo com a identidade da área */}
      <TopoArea
        area="habito"
        titulo="Hábitos"
        subtitulo={
          snapshot?.habitos?.length
            ? `${snapshot.habitos.length} ${snapshot.habitos.length === 1 ? "hábito" : "hábitos"} no seu jardim`
            : undefined
        }
        acoes={<BotaoNovoHabitoOffline />}
      >
        <div className="flex gap-2 flex-wrap">
          <Link href="/habitos/jardim" className="text-sm rounded-full bg-base-900/40 px-3 py-1.5 hover:bg-base-900/60 transition">
            🌳 Jardim
          </Link>
          <Link href="/habitos/estatisticas" className="text-sm rounded-full bg-base-900/40 px-3 py-1.5 hover:bg-base-900/60 transition">
            📊 Estatísticas
          </Link>
          <Link href="/habitos/lixeira" className="text-sm rounded-full bg-base-900/40 px-3 py-1.5 hover:bg-base-900/60 transition">
            🗑️ Lixeira
          </Link>
        </div>
      </TopoArea>


      {snapshot === undefined ? (
        <Esqueleto linhas={4} comTopo={false} />
      ) : !snapshot || snapshot.habitos.length === 0 ? (
        <EstadoVazio
          emoji="🌱"
          tom="habito"
          titulo="Nenhum hábito ainda"
          texto="Comece com um pequeno — beber água, ler 10 páginas, caminhar."
          acao={{ rotulo: "+ Criar hábito", href: "/habitos/novo" }}
        />
      ) : (
        <ListaComStreak snapshot={snapshot} aoMudar={recarregar} />
      )}
    </main>
  );
}

function ListaComStreak({
  snapshot,
  aoMudar,
}: {
  snapshot: NonNullable<ReturnType<typeof useSnapshotOffline>["snapshot"]>;
  aoMudar?: () => void;
}) {
  const mapaCategorias = new Map(snapshot.categoriasProdutividade.map((c) => [c.id, c.nome]));

  const datasPorHabito = new Map<string, string[]>();
  for (const c of snapshot.habitoCheckins) {
    if (!datasPorHabito.has(c.habito_id)) datasPorHabito.set(c.habito_id, []);
    datasPorHabito.get(c.habito_id)!.push(c.data);
  }

  const habitosOrdenados = [...snapshot.habitos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  const habitosComStreak = habitosOrdenados.map((h) => {
    const datas = datasPorHabito.get(h.id) ?? [];
    const nomeCategoria = h.categoria_id ? mapaCategorias.get(h.categoria_id) : undefined;
    const base = {
      ...h,
      categorias_produtividade: nomeCategoria ? { nome: nomeCategoria } : null,
    };
    if (h.eh_negativo) {
      return {
        ...base,
        streakAtual: calcularStreakNegativo(datas, (h.criado_em as string).slice(0, 10)),
        melhorStreak: 0,
      };
    }
    return {
      ...base,
      ultimos7: ultimosDias(h, snapshot.habitoCheckins, hojeISO()),
      streakAtual: calcularStreak(datas, pausasDe(h)),
      melhorStreak: calcularMelhorStreak(datas, pausasDe(h)),
    };
  });

  return (
    <>
      <ModoFerias habitos={snapshot.habitos as any} />
      {/* Etapa 227 — cartão único no estilo da lista de Contas */}
      <div className="flex items-center justify-between mb-3 mt-2">
        <h2 className="text-xl font-semibold">Seus hábitos</h2>
        <Link href="/habitos/estatisticas" className="text-base text-ink-400 hover:text-ink-100 transition">
          Estatísticas ›
        </Link>
      </div>
      <ListaHabitosArrastavel habitos={habitosComStreak as any} aoMudar={aoMudar} />
      <Link
        href="/habitos/novo"
        className="flex items-center gap-3 mt-3 bg-base-800 border border-dashed border-base-600 rounded-3xl px-4 py-3.5 text-base hover:border-habito transition"
      >
        <span className="w-12 h-12 rounded-full bg-base-700 flex items-center justify-center text-2xl text-ink-400">+</span>
        Novo hábito
      </Link>
      <p className="hidden md:block text-xs text-ink-400 mt-3">No computador, arraste ⠿ para reordenar.</p>
    </>
  );
}

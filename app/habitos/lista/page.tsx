"use client";

import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { ListaHabitosArrastavel } from "@/components/ListaHabitosArrastavel";
import { BotaoNovoHabitoOffline } from "@/components/BotaoNovoHabitoOffline";
import { AlternadorHabitosTarefas } from "@/components/AlternadorHabitosTarefas";
import { calcularStreak, calcularMelhorStreak, calcularStreakNegativo } from "@/lib/habitos/streak";

// Etapa 127: lê do mesmo retrato local usado pelas outras telas —
// abre com o que já tinha salvo, atualiza sozinha se houver internet.
export default function ListaHabitosPage() {
  const { snapshot, recarregar } = useSnapshotOffline();

  return (
    <main className="max-w-2xl lg:max-w-4xl mx-auto px-6 md:px-12 pt-2">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-display font-semibold">Hábitos</h1>
        <div className="flex items-center gap-3">
          <Link href="/habitos/estatisticas" className="text-ink-400 text-sm hover:text-ink-100 transition">
            Estatísticas
          </Link>
          <Link href="/habitos/lixeira" className="text-ink-400 text-sm hover:text-ink-100 transition">
            Lixeira
          </Link>
          <BotaoNovoHabitoOffline />
        </div>
      </div>

      <AlternadorHabitosTarefas ativo="habitos" />

      {snapshot === undefined ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-base-800 border border-base-600 rounded-xl2" />
          ))}
        </div>
      ) : !snapshot || snapshot.habitos.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">Nenhum hábito ainda</p>
          <p className="text-ink-400 text-sm">Crie o primeiro na aba "Hoje" ou aqui mesmo.</p>
        </div>
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
      streakAtual: calcularStreak(datas),
      melhorStreak: calcularMelhorStreak(datas),
    };
  });

  return (
    <>
      <p className="text-xs text-ink-400 mb-3">Arraste ⠿ para reordenar</p>
      <ListaHabitosArrastavel habitos={habitosComStreak as any} aoMudar={aoMudar} />
    </>
  );
}

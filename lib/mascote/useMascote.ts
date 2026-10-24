"use client";

// Etapa 298 — junta tudo que o mascote precisa a partir do retrato local:
// dados salvos (perfis.mascote), hábitos feitos desde sempre (moedas),
// como está o dia de hoje (humor) e a função de salvar.
// Etapa 302 — barriga e saúde (lib/mascote/vida.ts): com fome ou doente,
// o humor muda pra "fome"/"doente".
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { resumoDoDia } from "@/lib/painel/seuDia";
import { faseDoMascote, humorDoMascote, lerMascote, moedasDisponiveis, type DadosMascote, type Humor } from "@/lib/mascote/mascote";
import { calcularVida, type Vida } from "@/lib/mascote/vida";
import { gravar } from "@/lib/local/gravar"; // Etapa 353 — sem internet: guarda e sobe depois

/** Hábitos feitos desde sempre; sem o número do servidor, conta o que tem no retrato. */
export function feitosDesdeSempre(snapshot: any): number {
  const total = snapshot?.perfil?.checkins_total;
  if (typeof total === "number") return total;
  const negativos = new Set(((snapshot?.habitos ?? []) as any[]).filter((h) => h.eh_negativo).map((h) => h.id));
  return ((snapshot?.habitoCheckins ?? []) as any[]).filter((c) => !negativos.has(c.habito_id)).length;
}

/** Humor final: doente pesa mais que tudo; fome só não ganha do sono. */
export function humorComVida(base: Humor, vida: Vida | null): Humor {
  if (!vida) return base;
  if (vida.estado === "doente") return "doente";
  if (vida.estado === "fome" && base !== "dormindo" && base !== "radiante") return "fome";
  return base;
}

export function useMascote(snapshot: any, hoje: string) {
  const [local, setLocal] = useState<DadosMascote | null | undefined>(undefined);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvo = lerMascote(snapshot?.perfil?.mascote);
  const mascote = local !== undefined ? local : salvo;
  const feitos = feitosDesdeSempre(snapshot);
  const dia = snapshot ? resumoDoDia(snapshot, hoje) : null;
  const fase = faseDoMascote(feitos);
  const hora = new Date().getHours();
  const vida = snapshot && mascote ? calcularVida(snapshot, hoje, hora, mascote.consumos ?? [], mascote.criadoEm) : null;
  const humor = humorComVida(humorDoMascote(dia?.habitos.feitos ?? 0, dia?.habitos.total ?? 0, hora), vida);
  const moedas = mascote ? moedasDisponiveis(feitos, mascote.gastos, mascote.bonus) : feitos * 10;

  async function salvar(novo: DadosMascote): Promise<boolean> {
    const antes = mascote;
    setLocal(novo);
    setSalvando(true);
    setErro(null);
    try {
      const id = snapshot?.perfil?.id;
      if (!id) throw new Error("sem perfil");
      const { error } = await gravar({ tabela: "perfis", op: "update", id: id, valores: { mascote: novo } });
      if (error) throw error;
      void atualizarSnapshotEmTodasAsTelas();
      setSalvando(false);
      return true;
    } catch {
      setLocal(antes ?? null);
      setErro("Não salvou — confira a internet e tente de novo.");
      setSalvando(false);
      return false;
    }
  }

  return { mascote, feitos, fase, humor, moedas, dia, vida, salvar, salvando, erro };
}

"use server";

// Etapa 312 — cria um hábito a partir de um modelo das trilhas.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { modeloPorId } from "@/lib/habitos/trilhas";

export async function criarHabitoDoModelo(modeloId: string): Promise<{ ok: boolean; id?: string; erro?: string }> {
  const modelo = modeloPorId(modeloId);
  if (!modelo) return { ok: false, erro: "Modelo não encontrado" };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão expirada — entre de novo" };

  const { count } = await supabase.from("habitos").select("id", { count: "exact", head: true }).eq("dono_id", user.id);
  const { data, error } = await supabase
    .from("habitos")
    .insert({
      dono_id: user.id,
      nome: modelo.nome,
      cor: modelo.cor,
      icone: modelo.icone,
      frequencia: "diaria",
      dias_semana: [],
      meta_diaria: modelo.meta ?? 1,
      unidade: modelo.unidade ?? null,
      eh_negativo: !!modelo.negativo,
      ordem: count ?? 0,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, erro: error?.message ?? "Não deu pra criar agora" };
  revalidatePath("/habitos");
  revalidatePath("/habitos/lista");
  return { ok: true, id: data.id as string };
}

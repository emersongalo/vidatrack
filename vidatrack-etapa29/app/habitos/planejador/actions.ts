"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function criarBloco(dados: {
  data: string;
  horaInicio: string;
  horaFim: string;
  titulo: string;
  cor: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("blocos_tempo").insert({
    dono_id: user!.id,
    titulo: dados.titulo || "Sem título",
    data: dados.data,
    hora_inicio: dados.horaInicio,
    hora_fim: dados.horaFim,
    cor: dados.cor,
  });

  revalidatePath("/habitos/planejador");
}

export async function moverOuRedimensionarBloco(
  blocoId: string,
  horaInicio: string,
  horaFim: string
) {
  const supabase = createClient();
  await supabase
    .from("blocos_tempo")
    .update({ hora_inicio: horaInicio, hora_fim: horaFim })
    .eq("id", blocoId);

  revalidatePath("/habitos/planejador");
}

export async function renomearBloco(blocoId: string, titulo: string) {
  const supabase = createClient();
  await supabase
    .from("blocos_tempo")
    .update({ titulo: titulo || "Sem título" })
    .eq("id", blocoId);

  revalidatePath("/habitos/planejador");
}

export async function removerBloco(blocoId: string) {
  const supabase = createClient();
  await supabase.from("blocos_tempo").delete().eq("id", blocoId);
  revalidatePath("/habitos/planejador");
}

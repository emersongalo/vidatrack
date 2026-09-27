"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function concluirOnboarding() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("perfis").update({ onboarding_concluido: true }).eq("id", user.id);

  redirect("/dashboard");
}

type HabitoInicial = { nome: string; icone: string; cor: string; negativo?: boolean };

const CORES_OK = new Set(["habito", "nota", "financa", "rosa", "azul", "roxo", "verde", "laranja", "ciano", "neutro"]);
const BANCOS_OK: Record<string, string> = {
  nubank: "Nubank",
  inter: "Inter",
  itau: "Itaú",
  bradesco: "Bradesco",
  santander: "Santander",
  c6: "C6 Bank",
  caixa: "Caixa",
  bb: "Banco do Brasil",
  picpay: "PicPay",
  mercadopago: "Mercado Pago",
};

/**
 * Etapa 201 — primeiro uso guiado: cria de uma vez os hábitos
 * escolhidos (com o horário de lembrete) e as contas dos bancos
 * marcados. Não duplica: se já existir um hábito/conta com o mesmo
 * nome, pula. Devolve o resultado em vez de redirecionar (a tela
 * mostra "Tudo pronto" e os erros, se houver).
 */
export async function configurarInicio(dados: {
  habitos: HabitoInicial[];
  bancos: string[];
  carteira: boolean;
  horario: string | null;
}): Promise<{ erro?: string; habitos?: number; contas?: number }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const horario = dados.horario && /^\d{2}:\d{2}$/.test(dados.horario) ? dados.horario : null;

  // ---- hábitos
  const { data: existentes } = await supabase.from("habitos").select("nome").eq("dono_id", user.id);
  const jaTem = new Set((existentes ?? []).map((h) => String(h.nome).trim().toLowerCase()));
  const habitos = (dados.habitos ?? [])
    .map((h) => ({ ...h, nome: String(h.nome ?? "").trim().slice(0, 60) }))
    .filter((h) => h.nome && !jaTem.has(h.nome.toLowerCase()))
    .slice(0, 15);

  let criadosHabitos = 0;
  if (habitos.length) {
    const base = existentes?.length ?? 0;
    const { error } = await supabase.from("habitos").insert(
      habitos.map((h, i) => ({
        dono_id: user.id,
        nome: h.nome,
        icone: String(h.icone || "Sparkles").slice(0, 30),
        cor: CORES_OK.has(h.cor) ? h.cor : "habito",
        frequencia: "diaria",
        dias_semana: [],
        meta_diaria: 1,
        eh_negativo: !!h.negativo,
        // hábito "parar de fazer" não faz sentido lembrar todo dia
        horario_lembrete: h.negativo ? null : horario,
        ordem: base + i,
      }))
    );
    if (error) return { erro: "Não consegui criar os hábitos: " + error.message };
    criadosHabitos = habitos.length;
  }

  // ---- contas
  const { data: contasExistentes } = await supabase.from("financa_contas").select("nome").eq("dono_id", user.id);
  const contaJaTem = new Set((contasExistentes ?? []).map((c) => String(c.nome).trim().toLowerCase()));
  const novasContas: { nome: string; tipo: string; banco: string }[] = [];
  for (const id of dados.bancos ?? []) {
    const nome = BANCOS_OK[id];
    if (nome && !contaJaTem.has(nome.toLowerCase())) novasContas.push({ nome, tipo: "banco", banco: id });
  }
  if (dados.carteira && !contaJaTem.has("carteira")) novasContas.push({ nome: "Carteira", tipo: "carteira", banco: "outro" });

  let criadasContas = 0;
  if (novasContas.length) {
    const { error } = await supabase
      .from("financa_contas")
      .insert(novasContas.slice(0, 12).map((c) => ({ ...c, dono_id: user.id, saldo_inicial: 0 })));
    if (error) return { erro: "Criei os hábitos, mas não as contas: " + error.message, habitos: criadosHabitos };
    criadasContas = Math.min(novasContas.length, 12);
  }

  await supabase.from("perfis").update({ onboarding_concluido: true }).eq("id", user.id);

  revalidatePath("/habitos");
  revalidatePath("/financas");
  revalidatePath("/dashboard");
  return { habitos: criadosHabitos, contas: criadasContas };
}

import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { segredosIguais } from "@/lib/seguranca";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const USUARIO_DEMO_ID = "feeb9a5c-8840-45df-bdd9-ebd28db21285";

const CONTA_NUBANK = "a1000000-0000-0000-0000-000000000001";
const CONTA_CARTEIRA = "a1000000-0000-0000-0000-000000000002";
const CONTA_RESERVA = "a1000000-0000-0000-0000-000000000003";

const HABITO_AGUA = "b1000000-0000-0000-0000-000000000001";
const HABITO_EXERCICIO = "b1000000-0000-0000-0000-000000000002";
const HABITO_LER = "b1000000-0000-0000-0000-000000000003";
const HABITO_MEDITAR = "b1000000-0000-0000-0000-000000000004";
const HABITO_NAO_FUMAR = "b1000000-0000-0000-0000-000000000005";

/**
 * Chamada por um agendador externo, algumas vezes por dia — apaga
 * tudo que a conta de demonstração pública tem e recria do zero os
 * dados de exemplo. Existe porque é uma conta só, compartilhada por
 * qualquer visitante da página de apresentação: sem isso, o que uma
 * pessoa mexer fica visível pra próxima pra sempre.
 */
export async function GET(request: Request) {
  const segredoEsperado = process.env.CRON_SECRET;
  const segredoDoCabecalho = request.headers.get("authorization")?.replace("Bearer ", "");
  const segredoDaUrl = new URL(request.url).searchParams.get("secret");
  const segredoRecebido = segredoDoCabecalho ?? segredoDaUrl;

  if (!segredoEsperado || !segredoRecebido || !segredosIguais(segredoRecebido, segredoEsperado)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const supabase = criarClienteAdmin("cron_resetar_demo", "Reset periódico da conta de demonstração pública");

  // Apaga tudo que existe hoje pra esse usuário, em qualquer tabela
  // que tenha dado dele. A ordem importa por causa das dependências
  // (ex: transação depende de conta existir).
  await supabase.from("divisoes_despesa").delete().eq("dono_id", USUARIO_DEMO_ID);
  await supabase.from("financa_transacoes").delete().eq("dono_id", USUARIO_DEMO_ID);
  await supabase.from("metas_financeiras").delete().eq("dono_id", USUARIO_DEMO_ID);
  await supabase.from("financa_contas").delete().eq("dono_id", USUARIO_DEMO_ID);
  await supabase.from("habito_checkins").delete().eq("usuario_id", USUARIO_DEMO_ID);
  await supabase.from("tarefa_conclusoes").delete().eq("usuario_id", USUARIO_DEMO_ID);
  await supabase.from("habitos").delete().eq("dono_id", USUARIO_DEMO_ID);
  await supabase.from("tarefas").delete().eq("dono_id", USUARIO_DEMO_ID);

  // Recria as contas
  await supabase.from("financa_contas").insert([
    { id: CONTA_NUBANK, dono_id: USUARIO_DEMO_ID, nome: "Nubank", tipo: "banco", banco: "nubank", saldo_inicial: 2000 },
    { id: CONTA_CARTEIRA, dono_id: USUARIO_DEMO_ID, nome: "Carteira", tipo: "carteira", banco: "outro", saldo_inicial: 150 },
    { id: CONTA_RESERVA, dono_id: USUARIO_DEMO_ID, nome: "Reserva", tipo: "investimento", banco: "outro", saldo_inicial: 5000 },
  ]);

  // Recria os hábitos
  await supabase.from("habitos").insert([
    { id: HABITO_AGUA, dono_id: USUARIO_DEMO_ID, nome: "Beber água", cor: "habito", icone: "Droplet", frequencia: "diaria", dias_semana: [], meta_diaria: 1, ordem: 0 },
    { id: HABITO_EXERCICIO, dono_id: USUARIO_DEMO_ID, nome: "Exercitar-se", cor: "financa", icone: "Footprints", frequencia: "diaria", dias_semana: [], meta_diaria: 1, ordem: 1 },
    { id: HABITO_LER, dono_id: USUARIO_DEMO_ID, nome: "Ler", cor: "nota", icone: "BookOpen", frequencia: "dias_semana", dias_semana: [1, 3, 5], meta_diaria: 1, ordem: 2 },
    { id: HABITO_MEDITAR, dono_id: USUARIO_DEMO_ID, nome: "Meditar", cor: "habito", icone: "Flower2", frequencia: "diaria", dias_semana: [], meta_diaria: 1, ordem: 3 },
    { id: HABITO_NAO_FUMAR, dono_id: USUARIO_DEMO_ID, nome: "Não fumar", cor: "financa", icone: "Ban", frequencia: "diaria", dias_semana: [], meta_diaria: 1, eh_negativo: true, ordem: 4 },
  ]);

  // Recria as tarefas
  const hoje = new Date();
  const hojeISO = hoje.toLocaleDateString("sv-SE");
  const daquiA2Dias = new Date(hoje);
  daquiA2Dias.setDate(daquiA2Dias.getDate() + 2);
  await supabase.from("tarefas").insert([
    { dono_id: USUARIO_DEMO_ID, titulo: "Revisar orçamento do mês", icone: "NotebookPen", repetir: "nenhuma", data: hojeISO, ordem: 0 },
    { dono_id: USUARIO_DEMO_ID, titulo: "Agendar dentista", icone: "NotebookPen", repetir: "nenhuma", data: daquiA2Dias.toLocaleDateString("sv-SE"), ordem: 1 },
  ]);

  // Recria os check-ins dos últimos 9 dias
  const checkins: { habito_id: string; usuario_id: string; data: string; quantidade: number }[] = [];
  for (let i = 8; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    const diaISO = dia.toLocaleDateString("sv-SE");
    const diaSemana = dia.getDay();

    for (const habitoId of [HABITO_AGUA, HABITO_EXERCICIO, HABITO_MEDITAR]) {
      checkins.push({ habito_id: habitoId, usuario_id: USUARIO_DEMO_ID, data: diaISO, quantidade: 1 });
    }
    if ([1, 3, 5].includes(diaSemana)) {
      checkins.push({ habito_id: HABITO_LER, usuario_id: USUARIO_DEMO_ID, data: diaISO, quantidade: 1 });
    }
  }
  const dia15AtrasISO = new Date(hoje.getTime() - 15 * 86400000).toLocaleDateString("sv-SE");
  checkins.push({ habito_id: HABITO_NAO_FUMAR, usuario_id: USUARIO_DEMO_ID, data: dia15AtrasISO, quantidade: 1 });

  await supabase.from("habito_checkins").insert(checkins);

  // Recria os lançamentos financeiros — busca as categorias padrão
  // que já existem pra esse usuário (foram criadas uma vez só, no
  // cadastro, e não são apagadas no reset)
  const { data: categorias } = await supabase
    .from("financa_categorias")
    .select("id, nome")
    .eq("dono_id", USUARIO_DEMO_ID);

  function idCategoria(nome: string) {
    return categorias?.find((c) => c.nome === nome)?.id ?? null;
  }

  function diasAtras(qtd: number) {
    return new Date(hoje.getTime() - qtd * 86400000).toLocaleDateString("sv-SE");
  }

  const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 5).toLocaleDateString("sv-SE");

  await supabase.from("financa_transacoes").insert([
    { dono_id: USUARIO_DEMO_ID, conta_id: CONTA_NUBANK, categoria_id: idCategoria("Salário"), tipo: "receita", valor: 3500, descricao: "Salário", data: primeiroDiaDoMes },
    { dono_id: USUARIO_DEMO_ID, conta_id: CONTA_NUBANK, categoria_id: idCategoria("Alimentação"), tipo: "despesa", valor: 450, descricao: "Supermercado", data: diasAtras(6) },
    { dono_id: USUARIO_DEMO_ID, conta_id: CONTA_NUBANK, categoria_id: idCategoria("Moradia"), tipo: "despesa", valor: 120, descricao: "Internet", data: diasAtras(5) },
    { dono_id: USUARIO_DEMO_ID, conta_id: CONTA_NUBANK, categoria_id: idCategoria("Transporte"), tipo: "despesa", valor: 35, descricao: "Uber", data: diasAtras(4) },
    { dono_id: USUARIO_DEMO_ID, conta_id: CONTA_NUBANK, categoria_id: idCategoria("Saúde"), tipo: "despesa", valor: 60, descricao: "Farmácia", data: diasAtras(3) },
    { dono_id: USUARIO_DEMO_ID, conta_id: CONTA_NUBANK, categoria_id: idCategoria("Lazer"), tipo: "despesa", valor: 85, descricao: "Restaurante", data: diasAtras(2) },
    { dono_id: USUARIO_DEMO_ID, conta_id: CONTA_CARTEIRA, categoria_id: idCategoria("Transporte"), tipo: "despesa", valor: 20, descricao: "Ônibus", data: diasAtras(1) },
  ]);

  return NextResponse.json({ ok: true, resetadoEm: new Date().toISOString() });
}

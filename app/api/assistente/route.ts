import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { montarContextoAssistente } from "@/lib/ia/contexto";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { erro: "Assistente não configurado. Falta a variável ANTHROPIC_API_KEY no servidor." },
      { status: 500 }
    );
  }

  const { mensagens } = await request.json();
  if (!Array.isArray(mensagens) || mensagens.length === 0) {
    return NextResponse.json({ erro: "Mensagem vazia" }, { status: 400 });
  }
  // Limite simples pra não deixar a conversa crescer sem controle
  const mensagensRecentes = mensagens.slice(-16);

  const contexto = await montarContextoAssistente();

  const systemPrompt = `Você é o assistente financeiro do VidaTrack, um app pessoal de hábitos, notas e finanças.
Responda SEMPRE em português do Brasil, de forma direta e curta (poucos parágrafos, sem enrolação).
Use os dados reais abaixo pra responder — não invente números. Se a pergunta for sobre algo que não está
nos dados, diga que não tem essa informação em vez de chutar.
Você pode: resumir os gastos, comparar meses, avisar sobre orçamento estourado, listar contas a pagar,
e comentar hábitos/tarefas pendentes de hoje quando fizer sentido pra conversa.
Você NÃO é consultor financeiro licenciado — se a pergunta pedir uma recomendação de investimento ou
decisão financeira importante, diga isso e sugira que a pessoa converse com um profissional.

DADOS REAIS DO USUÁRIO (hoje):
${contexto}`;

  try {
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 700,
        system: systemPrompt,
        messages: mensagensRecentes.map((m: { autor: string; texto: string }) => ({
          role: m.autor === "usuario" ? "user" : "assistant",
          content: m.texto,
        })),
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      console.error("Erro da API Anthropic:", detalhe);
      return NextResponse.json({ erro: "O assistente não conseguiu responder agora. Tenta de novo." }, { status: 502 });
    }

    const dados = await resposta.json();
    const texto = dados.content?.find((b: any) => b.type === "text")?.text ?? "Não consegui gerar uma resposta.";

    return NextResponse.json({ texto });
  } catch (erro) {
    console.error("Erro ao chamar o assistente:", erro);
    return NextResponse.json({ erro: "Falha de conexão com o assistente." }, { status: 500 });
  }
}

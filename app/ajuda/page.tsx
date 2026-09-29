"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Etapa 218 — perguntas frequentes + fale conosco
const PERGUNTAS: { p: string; r: string }[] = [
  { p: "O app funciona sem internet?", r: "Sim. Hábitos, tarefas e lançamentos ficam guardados no aparelho e sincronizam quando a internet volta. Algumas ações (como editar conta ou criar meta) pedem conexão." },
  { p: "Por que um lançamento com data futura não saiu do meu saldo?", r: "Lançamento agendado só sai do saldo no dia dele (ou quando você toca em “✓ Paguei”). Até lá ele entra na previsão do fim do mês." },
  { p: "Como funciona o cartão de crédito?", r: "O que você gasta no cartão não sai do saldo na hora: vira fatura. Quando pagar, use “Pagar fatura” (é uma transferência do banco pro cartão). O app avisa 3 dias antes do vencimento." },
  { p: "Como lançar uma conta que repete todo mês?", r: "No lançamento, marque “Repetir todo mês”. Ela começa na data escolhida e aparece sozinha nos meses seguintes. Dá pra editar só um mês ou “este e os próximos”." },
  { p: "O que são as etiquetas?", r: "Marcadores livres (ex: #viagem-praia) pra somar gastos de categorias diferentes. Veja os totais em Finanças → Mais → Etiquetas." },
  { p: "Como pausar um hábito nas férias?", r: "Em Hábitos, toque em “Modo férias” (pausa todos) ou edite um hábito e use “Pausar por uns dias”. A sequência não quebra." },
  { p: "Como ter lembretes várias vezes no dia (ex: beber água)?", r: "Edite o hábito → Lembrete → “Vários” ou “A cada…”. Se você já tiver completado o hábito, o app não avisa de novo." },
  { p: "As notificações não chegam. O que fazer?", r: "Em Notificações, confira se estão ativadas. No Android, veja se o VidaTrack pode mostrar notificações e se a economia de bateria não está bloqueando o app." },
  { p: "Posso bloquear o app com senha?", r: "Sim. Perfil → Bloqueio por PIN. É opcional e vale só pro aparelho em que você ligar." },
  { p: "Como baixo meus dados?", r: "Perfil → Seus dados → Baixar backup (arquivo .json com tudo). A planilha de lançamentos e o relatório em PDF ficam em Finanças → Mais." },
  { p: "Como excluo minha conta?", r: "Perfil → “Excluir minha conta permanentemente”. Isso apaga todos os seus dados e não dá pra desfazer." },
];

export default function AjudaPage() {
  const [assunto, setAssunto] = useState("Dúvida");
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"parado" | "enviando" | "enviado" | "erro">("parado");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEstado("enviando");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("mensagens_suporte").insert({
      usuario_id: user?.id,
      assunto,
      texto: texto.trim().slice(0, 2000),
      pagina: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null,
    });
    if (error) return setEstado("erro");
    setTexto("");
    setEstado("enviado");
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-curta pb-16">
      <Link href="/perfil" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Perfil
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-6">Ajuda</h1>

      <div className="space-y-2 mb-10">
        {PERGUNTAS.map((q) => (
          <details key={q.p} className="group bg-base-800 border border-base-600 rounded-xl2 px-4 py-3">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-medium">
              {q.p}
              <span className="text-ink-400 transition group-open:rotate-45 text-lg leading-none">+</span>
            </summary>
            <p className="text-sm text-ink-400 mt-2">{q.r}</p>
          </details>
        ))}
      </div>

      <h2 className="text-lg font-display font-semibold mb-1">Fale conosco</h2>
      <p className="text-sm text-ink-400 mb-3">Achou um erro, tem uma ideia ou ficou com dúvida? Manda aqui — a gente lê tudo.</p>
      {estado === "enviado" ? (
        <div className="bg-habito-soft border border-habito/30 rounded-xl2 p-4 text-sm">
          ✅ Mensagem enviada! Obrigado por ajudar a melhorar o VidaTrack.
          <button type="button" onClick={() => setEstado("parado")} className="block text-xs text-ink-400 underline mt-2">
            Enviar outra
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {["Dúvida", "Encontrei um erro", "Sugestão", "Outro"].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAssunto(a)}
                className={`text-xs rounded-full px-3 py-1.5 border ${assunto === a ? "border-ink-100 bg-base-700" : "border-base-600 text-ink-400"}`}
              >
                {a}
              </button>
            ))}
          </div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={2000}
            rows={5}
            required
            placeholder="Conte com detalhes (em qual tela, o que você fez...)"
            className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-sm text-ink-100 outline-none focus:border-ink-100"
          />
          {estado === "erro" && <p className="text-sm text-red-400">Não consegui enviar. Verifique a internet e tente de novo.</p>}
          <button type="submit" disabled={estado === "enviando"} className="w-full bg-ink-100 text-base-900 font-medium rounded-2xl py-3.5 disabled:opacity-50">
            {estado === "enviando" ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      )}
    </main>
  );
}

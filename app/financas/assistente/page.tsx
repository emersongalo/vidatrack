import Link from "next/link";
import { ChatAssistente } from "@/components/ChatAssistente";

// Etapa 219 — a tela tem altura fixa (a da tela do celular menos a barra
// de baixo): só a conversa rola por dentro, o título e o campo de digitar
// ficam parados. Antes a página inteira passava da altura da tela e
// "deslizava" a cada resposta.
export default function AssistentePage() {
  return (
    <main className="h-[calc(100dvh-6rem)] lg:h-[100dvh] overflow-hidden px-6 pt-6 md:px-12 md:pt-12 pagina-curta flex flex-col">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition mb-2 shrink-0">
        ← Finanças
      </Link>
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <span className="text-xl">🤖</span>
        <h1 className="text-2xl font-display font-semibold">Assistente</h1>
      </div>
      <ChatAssistente />
    </main>
  );
}

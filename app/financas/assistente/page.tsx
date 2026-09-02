import Link from "next/link";
import { ChatAssistente } from "@/components/ChatAssistente";

export default function AssistentePage() {
  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition mb-2">
        ← Finanças
      </Link>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤖</span>
        <h1 className="text-2xl font-display font-semibold">Assistente</h1>
      </div>
      <ChatAssistente />
    </main>
  );
}

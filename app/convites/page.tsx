"use client";

// Etapa 273 — todos os convites de compartilhamento que chegaram pra você.
import Link from "next/link";
import { ConvitesPendentes } from "@/components/ConvitesPendentes";
import { EstadoVazio } from "@/components/EstadoVazio";

export default function ConvitesPage() {
  return (
    <main className="min-h-screen p-6 md:p-12 pagina-curta">
      <Link href="/dashboard" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Início
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Convites</h1>
      <p className="text-ink-400 text-sm mb-6">
        Alguém quer compartilhar um hábito, uma tarefa ou uma conta com você. Nada é compartilhado até você aceitar.
      </p>
      <ConvitesPendentes
        vazio={
          <EstadoVazio
            emoji="📭"
            titulo="Nenhum convite agora"
            texto="Quando alguém quiser compartilhar algo com você, aparece aqui e chega uma notificação."
          />
        }
      />
    </main>
  );
}

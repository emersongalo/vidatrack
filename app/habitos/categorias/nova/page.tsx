"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { criarCategoriaProdutividade } from "../actions";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { CORES_DISPONIVEIS } from "@/lib/agenda/estilo";
import { gravar } from "@/lib/local/gravar";
import { novoUuid } from "@/lib/local/acaoOffline";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";

export default function NovaCategoriaPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const [cor, setCor] = useState("habito");
  const [erroOffline, setErroOffline] = useState<string | null>(null);
  const router = useRouter();

  return (
    <main className="pagina-form px-6 md:px-12 pt-2">
      <Link href="/habitos/categorias" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Categorias
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-6">Nova categoria</h1>

      {(erroOffline || searchParams.erro) && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {erroOffline ?? decodeURIComponent(searchParams.erro!)}
        </p>
      )}

      {/* Etapa 354 — sem internet: a categoria nasce no aparelho */}
      <form
        action={criarCategoriaProdutividade}
        onSubmit={async (e) => {
          if (navigator.onLine !== false) return;
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const nome = String(f.get("nome") ?? "").trim();
          if (!nome) return setErroOffline("Dê um nome para a categoria");
          const snap = lerSnapshotOffline();
          const id = novoUuid();
          await gravar({ tabela: "categorias_produtividade", op: "insert", valores: { id, dono_id: snap?.perfil.id, nome, cor: String(f.get("cor") ?? "habito") } });
          router.push("/habitos/categorias");
        }}
      >
        <div className="form-colunas">
        <div>
          <label htmlFor="nome" className="block text-sm text-ink-400 mb-1">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            placeholder="Ex: Trabalho, Saúde, Casa"
            className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>

        <div>
          <span className="block text-sm text-ink-400 mb-2">Cor</span>
          <div className="flex flex-wrap gap-3">
            {CORES_DISPONIVEIS.map((c) => (
              <button
                type="button"
                key={c.valor}
                onClick={() => setCor(c.valor)}
                aria-label={`Cor ${c.valor}`}
                className={`w-8 h-8 rounded-full ${c.classe} ${
                  cor === c.valor ? "ring-2 ring-offset-2 ring-offset-base-900 ring-ink-100" : ""
                }`}
              />
            ))}
          </div>
          <input type="hidden" name="cor" value={cor} />
        </div>
        </div>

        <div className="form-rodape">
          <BotaoSalvarFormulario>Criar categoria</BotaoSalvarFormulario>
        </div>
      </form>
    </main>
  );
}

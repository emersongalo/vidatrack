"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { criarDivisao } from "../divisoes/actions";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { criarDivisaoLocal } from "@/lib/local/divisoes";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";

// Etapa 129 — dinheiro entre pessoas diferentes merece vir sempre
// fresco do servidor, então busca direto (não entra no retrato).
export default function DividirDespesaPage() {
  return (
    <Suspense fallback={null}>
      <DividirConteudo />
    </Suspense>
  );
}

function DividirConteudo() {
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro");
  const [transacoes, setTransacoes] = useState<any[] | null>(null);

  const router = useRouter();
  const [erroOffline, setErroOffline] = useState<string | null>(null);
  useEffect(() => {
    // Etapa 354 — sem internet: as despesas vêm do que está no aparelho
    const doAparelho = () => {
      const snap = lerSnapshotOffline();
      const contas = new Map(((snap?.financas.contas ?? []) as any[]).map((c) => [c.id, c.nome]));
      setTransacoes(
        ((snap?.financas.transacoes ?? []) as any[])
          .filter((t) => t.tipo === "despesa" && !t.transferencia_grupo)
          .sort((a, b) => String(b.data).localeCompare(String(a.data)))
          .slice(0, 30)
          .map((t) => ({ ...t, financa_contas: { nome: contas.get(t.conta_id) } }))
      );
    };
    if (navigator.onLine === false) return doAparelho();
    createClient()
      .from("financa_transacoes")
      .select("id, descricao, valor, data, financa_contas(nome)")
      .eq("tipo", "despesa")
      .order("data", { ascending: false })
      .limit(30)
      .then(({ data, error }) => (error ? doAparelho() : setTransacoes(data ?? [])));
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-form">
      <Link href="/financas/divisoes" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Divisões
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Dividir despesa</h1>
      <p className="text-ink-400 text-sm mb-6">
        Escolhe um lançamento já existente e quanto a outra pessoa deve te pagar dessa despesa.
      </p>

      {(erroOffline || erro) && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {erroOffline ?? decodeURIComponent(erro!)}
        </p>
      )}

      {!transacoes || transacoes.length === 0 ? (
        <p className="text-sm text-ink-400">
          {transacoes === null ? "Carregando..." : "Nenhuma despesa lançada ainda pra dividir."}
        </p>
      ) : (
        <form
          action={criarDivisao}
          onSubmit={(e) => {
            if (navigator.onLine !== false) return;
            e.preventDefault();
            const msg = criarDivisaoLocal(new FormData(e.currentTarget));
            if (msg) return setErroOffline(msg);
            router.push("/financas/divisoes");
          }}
        >
          <div className="form-colunas">
          <div className="lg:col-span-2">
            <label className="block text-xs text-ink-400 mb-1.5">Qual despesa</label>
            <select
              name="transacaoId"
              required
              className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              {transacoes.map((t) => (
                <option key={t.id} value={t.id}>
                  {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                  {t.descricao || t.financa_contas?.nome || "Sem descrição"} · {formatarMoeda(t.valor)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-ink-400 mb-1.5">E-mail de quem participa</label>
            <input
              name="participanteEmail"
              type="email"
              required
              placeholder="pessoa@exemplo.com"
              className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-400 mb-1.5">Quanto essa pessoa deve pagar</label>
            <CampoValorMonetario
              name="valor"
              required
              placeholder="0,00"
              className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 font-mono focus:border-ink-100 outline-none transition"
            />
          </div>

          </div>

          <div className="form-rodape">
            <BotaoSalvarFormulario>Registrar divisão</BotaoSalvarFormulario>
          </div>
        </form>
      )}
    </main>
  );
}

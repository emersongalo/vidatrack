import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarConta, arquivarConta } from "../actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { SeloBanco } from "@/components/SeloBanco";
import { ValorMonetario } from "@/components/ValorMonetario";
import { AvataresEmpilhados } from "@/components/AvataresEmpilhados";
import { resolverUrlFoto } from "@/lib/perfil/foto";
import { BANCOS } from "@/lib/financas/bancos";

const RÓTULOS_TIPO: Record<string, string> = {
  carteira: "Carteira",
  banco: "Banco",
  cartao: "Cartão",
};

export default async function ContasPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contas } = await supabase
    .from("financa_contas")
    .select("id, nome, tipo, banco, saldo_inicial, dono_id")
    .eq("arquivado", false)
    .order("criado_em", { ascending: true });

  const idsContas = (contas ?? []).map((c) => c.id);

  const { data: compartilhamentos } = idsContas.length
    ? await supabase
        .from("compartilhamentos")
        .select("item_id, usuario_convidado_id, email_convidado")
        .eq("tipo_item", "financa")
        .in("item_id", idsContas)
    : { data: [] as any[] };

  const idsPessoasCompartilhadas = Array.from(
    new Set((compartilhamentos ?? []).map((c) => c.usuario_convidado_id).filter(Boolean))
  );

  const { data: perfisCompartilhados } = idsPessoasCompartilhadas.length
    ? await supabase.from("perfis").select("id, nome, foto_url").in("id", idsPessoasCompartilhadas)
    : { data: [] as any[] };

  const mapaPerfis = new Map((perfisCompartilhados ?? []).map((p) => [p.id, p]));

  // Resolve as URLs de foto (algumas podem ser chave do R2, que
  // precisa de link assinado) de uma vez só, fora do loop de render.
  const mapaUrlFoto = new Map<string, string | null>();
  for (const p of perfisCompartilhados ?? []) {
    mapaUrlFoto.set(p.id, await resolverUrlFoto(p.foto_url));
  }

  const minhaFotoUrl = user?.id ? await resolverUrlFoto((await supabase.from("perfis").select("foto_url").eq("id", user.id).maybeSingle()).data?.foto_url ?? null) : null;

  function pessoasDaConta(contaId: string, donoId: string) {
    const idsConvidados = (compartilhamentos ?? [])
      .filter((c) => c.item_id === contaId && c.usuario_convidado_id)
      .map((c) => c.usuario_convidado_id as string);

    if (idsConvidados.length === 0) return [];

    const pessoas = idsConvidados.map((id) => {
      const perfil = mapaPerfis.get(id);
      return { nome: perfil?.nome ?? "Alguém", urlFoto: mapaUrlFoto.get(id) ?? null };
    });

    // Inclui você também na pilha de avatares, se a conta for sua
    if (donoId === user?.id) {
      pessoas.unshift({ nome: "Você", urlFoto: minhaFotoUrl });
    }

    return pessoas;
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-2xl font-display font-semibold">Contas</h1>
        <Link href="/financas/contas/lixeira" className="text-ink-400 text-xs hover:text-ink-100 transition">
          Lixeira
        </Link>
      </div>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      {contas && contas.length > 0 && (
        <ul className="space-y-2 mb-8">
          {contas.map((conta) => {
            const pessoas = pessoasDaConta(conta.id, conta.dono_id);
            return (
              <li
                key={conta.id}
                className="bg-base-800 border border-base-600 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <SeloBanco bancoId={conta.banco} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{conta.nome}</p>
                      <p className="text-xs text-ink-400">
                        {RÓTULOS_TIPO[conta.tipo]} · saldo inicial{" "}
                        <ValorMonetario valor={Number(conta.saldo_inicial)} />
                      </p>
                    </div>
                  </div>
                  {pessoas.length > 0 && <AvataresEmpilhados pessoas={pessoas} />}
                </div>
                <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-base-600">
                  <Link
                    href={`/financas/contas/${conta.id}/editar`}
                    className="text-ink-400 hover:text-ink-100 transition text-xs"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/financas/contas/${conta.id}/compartilhar`}
                    className="text-ink-400 hover:text-ink-100 transition text-xs"
                  >
                    {pessoas.length > 0 ? "Gerenciar compartilhamento" : "Compartilhar"}
                  </Link>
                  <span className="flex-1" />
                  <BotaoComConfirmacao acao={arquivarConta.bind(null, conta.id)} textoBotao="Arquivar" />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-sm text-ink-400 mb-3">Nova conta</p>
      <form action={criarConta} className="space-y-3">
        <input
          name="nome"
          type="text"
          required
          placeholder="Ex: Carteira, Nubank, Cartão Inter"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
        />
        <select
          name="tipo"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
        >
          <option value="banco">Banco</option>
          <option value="carteira">Carteira</option>
          <option value="cartao">Cartão</option>
        </select>
        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Banco (pra mostrar o selo certo)</label>
          <select
            name="banco"
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            {BANCOS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
        <input
          name="saldoInicial"
          type="text"
          inputMode="decimal"
          placeholder="Saldo inicial (opcional, ex: 150,00)"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
        />
        <button
          type="submit"
          className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
        >
          Criar conta
        </button>
      </form>
    </main>
  );
}

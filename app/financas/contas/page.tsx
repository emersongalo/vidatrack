"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Pencil, Share2, Archive, Trash2, Receipt, Lock, Users } from "lucide-react";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { arquivarConta, excluirContaDefinitivamente } from "../actions";
import { chamarOuGuardar, enfileirarAcao } from "@/lib/local/acaoOffline";
import { pedidoArquivarConta, pedidoCriarConta, pedidoExcluirConta } from "@/lib/local/financasCadastros";
import { createClient } from "@/lib/supabase/client";
import { esquemaConta, primeiroErro } from "@/lib/validacao/financas";
import { SeletorTipoConta } from "@/components/SeletorTipoConta";
import { lerLimite } from "@/lib/financas/limite";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { MenuAcoes, ItemMenuAcoes } from "@/components/MenuAcoes";
import { LinhaComDeslizar } from "@/components/LinhaComDeslizar";
import { SeloBanco } from "@/components/SeloBanco";
import { ValorMonetario } from "@/components/ValorMonetario";
import { BANCOS } from "@/lib/financas/bancos";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { resumoCartao, textoVencimento } from "@/lib/financas/cartaoResumo";
import { contaEhCompartilhada } from "@/lib/financas/escopo";
import { vibrar } from "@/lib/app/vibrar";

const RÓTULOS_TIPO: Record<string, string> = {
  carteira: "Carteira",
  banco: "Banco",
  cartao: "Cartão",
  investimento: "Investimento",
};

// Etapa 127: a LISTA abre com o que estiver salvo localmente.
// Etapa 352: criar, editar, arquivar e excluir também funcionam sem
// internet (ficam no aparelho e sobem quando a conexão volta). Os avatares de quem
// compartilha uma conta também ficam de fora por enquanto (a foto
// depende de um link assinado gerado no servidor).
export default function ContasPage() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const contas = snapshot?.financas.contas ?? [];
  const transacoesTodas = (snapshot?.financas.transacoes ?? []) as any[];
  const hojeLocal = new Date().toLocaleDateString("sv-SE");
  const formRef = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [criada, setCriada] = useState<string | null>(null);
  // Etapa 367 — conta compartilhada x particular
  const meuId = snapshot?.perfil?.id;
  const temParceiro = contas.some((c: any) => contaEhCompartilhada(c, meuId));
  const [compartilharNova, setCompartilharNova] = useState(true);
  const [mudando, setMudando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; erro?: boolean; link?: string } | null>(null);

  async function definirCompartilhada(conta: any, compartilhar: boolean) {
    setAviso(null);
    if (!navigator.onLine) return setAviso({ texto: "Precisa de internet pra mudar quem vê a conta.", erro: true });
    setMudando(conta.id);
    try {
      const { data, error } = await createClient().rpc("definir_conta_compartilhada", { p_conta: conta.id, p_compartilhar: compartilhar });
      if (error) throw error;
      if (compartilhar && !Number(data)) {
        setAviso({
          texto: "Você ainda não divide as finanças com ninguém. Convide a pessoa por aqui:",
          link: `/financas/contas/${conta.id}/compartilhar`,
        });
      } else {
        vibrar(12);
        setAviso({ texto: compartilhar ? `"${conta.nome}" agora é compartilhada 👥` : `"${conta.nome}" agora é particular 🔒 — só você vê.` });
      }
      await recarregar();
    } catch (e: any) {
      setAviso({ texto: "Não consegui mudar: " + String(e?.message ?? e ?? "erro"), erro: true });
    }
    setMudando(null);
  }

  // Etapa 199b — cria a conta DIRETO pelo Supabase do aparelho (as
  // regras de segurança do banco garantem que só dá pra criar conta
  // sua). Antes passava por uma Ação de Servidor, que falhava calada
  // quando o app estava com uma versão antiga carregada.
  async function aoCriar(formData: FormData) {
    setErro(null);
    setCriada(null);
    const falhar = (msg: string) => {
      setErro(msg);
      try {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pagina: ("erro-criar-conta: " + msg).slice(0, 200) }),
        });
      } catch {}
    };
    // Etapa 352 — sem internet: a conta nasce no aparelho e sobe depois
    if (!navigator.onLine) {
      const nome = String(formData.get("nome") ?? "").trim();
      const pedido = pedidoCriarConta(formData);
      if (typeof pedido === "string") return falhar(pedido);
      enfileirarAcao(pedido);
      setCriada(nome);
      formRef.current?.reset();
      return;
    }

    const resultado = esquemaConta.safeParse({
      nome: formData.get("nome"),
      tipo: formData.get("tipo"),
      banco: formData.get("banco"),
      saldoInicial: formData.get("saldoInicial"),
      diaFechamento: formData.get("diaFechamento"),
      diaVencimento: formData.get("diaVencimento"),
    });
    if (!resultado.success) return falhar(primeiroErro(resultado));

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return falhar("Sua sessão expirou. Saia e entre de novo.");

      const { data: nova, error } = await supabase.from("financa_contas").insert({
        dono_id: user.id,
        nome: resultado.data.nome,
        tipo: resultado.data.tipo,
        banco: resultado.data.banco,
        saldo_inicial: resultado.data.saldoInicial,
        dia_fechamento: resultado.data.diaFechamento,
        dia_vencimento: resultado.data.diaVencimento,
        // Etapa 230 — limite do cartão
        limite: resultado.data.tipo === "cartao" ? lerLimite(formData.get("limite")) : null,
      }).select("id").single();
      if (error) return falhar(error.message);
      // Etapa 367 — já nasce compartilhada (se a pessoa divide as finanças com alguém)
      if (temParceiro && compartilharNova && nova?.id) {
        await supabase.rpc("definir_conta_compartilhada", { p_conta: nova.id, p_compartilhar: true });
      }

      setCriada(resultado.data.nome);
      formRef.current?.reset();
      await recarregar();
    } catch (e: any) {
      falhar(String(e?.message ?? e ?? "erro desconhecido"));
    }
  }


  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/financas" className="hidden lg:inline text-ink-400 text-base hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-3xl font-display font-bold">Contas</h1>
        <Link href="/financas/contas/lixeira" className="text-ink-400 text-xs hover:text-ink-100 transition">
          Lixeira
        </Link>
      </div>

      {aviso && (
        <p
          className={`mb-3 text-sm rounded-lg px-3 py-2 border ${
            aviso.erro ? "text-red-400 bg-red-400/10 border-red-400/30" : "text-ink-100 bg-financa/10 border-financa/30"
          }`}
        >
          {aviso.texto}
          {aviso.link && (
            <Link href={aviso.link} className="block text-financa font-medium mt-1">
              Compartilhar a conta ›
            </Link>
          )}
        </p>
      )}
      {contas.length > 0 && (
        <ul className="space-y-2 mb-8 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {contas.map((conta: any) => (
            <li key={conta.id}>
              <LinhaComDeslizar
                acao={() => chamarOuGuardar(() => arquivarConta(conta.id), pedidoArquivarConta(conta.id, conta.nome)).then(() => {})}
                textoConfirmacao={`Arquivar "${conta.nome}"? Ela some das listas, mas os dados continuam guardados — dá pra restaurar depois.`}
                aoConcluir={recarregar}
                icone={<Archive size={18} className="text-base-900" />}
                corFundo="bg-financa"
              >
              <div className="bg-base-800 border border-base-600 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <SeloBanco bancoId={conta.banco} nome={conta.nome} tipo={conta.tipo} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{conta.nome}</p>
                    <p className="text-xs text-ink-400">
                      {RÓTULOS_TIPO[conta.tipo]}
                      {/* Etapa 367 — de quem é */}
                      {(temParceiro || conta.compartilhada) &&
                        (contaEhCompartilhada(conta, meuId) ? (
                          <span className="text-financa"> · 👥 Compartilhada</span>
                        ) : (
                          <span className="text-ink-400"> · 🔒 Particular</span>
                        ))}
                    </p>
                    {conta.tipo === "cartao" && (!conta.dia_fechamento || !conta.dia_vencimento) && (
                      <Link href={`/financas/contas/${conta.id}/editar`} className="block text-xs text-financa mt-0.5">
                        Defina fechamento e vencimento pra ver a fatura e receber o aviso de pagar ›
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Etapa 237 — cartão mostra a fatura, não "saldo" */}
                  {conta.tipo === "cartao" ? (
                    (() => {
                      const r = resumoCartao(conta, transacoesTodas, hojeLocal);
                      return (
                        <Link href={`/financas/contas/${conta.id}/fatura`} className="text-right mr-1">
                          <span className="block text-xs text-ink-400">{r.proxima?.fechada ? "Fatura a pagar" : "Fatura atual"}</span>
                          <span className="block font-mono text-sm font-semibold text-red-400">
                            <ValorMonetario valor={r.proxima?.valor ?? r.devendo} />
                          </span>
                          {r.proxima?.vencimento && (
                            <span className="block text-xs text-ink-400">{textoVencimento(r.proxima.vencimento, hojeLocal)}</span>
                          )}
                        </Link>
                      );
                    })()
                  ) : (
                    <span className="font-mono text-sm mr-1">
                      <ValorMonetario valor={Number(conta.saldo)} />
                    </span>
                  )}
                  <MenuAcoes>
                    {(fecharMenu) => (
                      <>
                        {conta.tipo === "cartao" && conta.dia_fechamento && (
                          <ItemMenuAcoes href={`/financas/contas/${conta.id}/fatura`}>
                            <Receipt size={15} strokeWidth={2} /> Ver fatura
                          </ItemMenuAcoes>
                        )}
                        <ItemMenuAcoes href={`/financas/contas/${conta.id}/editar`}>
                          <Pencil size={15} strokeWidth={2} /> Editar
                        </ItemMenuAcoes>
                        {/* Etapa 367 — só quem é dono da conta escolhe se é compartilhada ou particular */}
                        {temParceiro && (!meuId || conta.dono_id === meuId) && (
                          <button
                            type="button"
                            disabled={mudando === conta.id}
                            onClick={() => {
                              fecharMenu();
                              const comp = contaEhCompartilhada(conta, meuId);
                              if (comp && !confirm(`Tornar "${conta.nome}" particular? A outra pessoa deixa de ver essa conta, o saldo e os lançamentos dela.`)) return;
                              definirCompartilhada(conta, !comp);
                            }}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-left text-ink-100 hover:bg-base-700 transition disabled:opacity-50"
                          >
                            {contaEhCompartilhada(conta, meuId) ? (
                              <>
                                <Lock size={15} strokeWidth={2} /> Tornar particular
                              </>
                            ) : (
                              <>
                                <Users size={15} strokeWidth={2} /> Tornar compartilhada
                              </>
                            )}
                          </button>
                        )}
                        <ItemMenuAcoes href={`/financas/contas/${conta.id}/compartilhar`}>
                          <Share2 size={15} strokeWidth={2} /> {temParceiro ? "Quem tem acesso" : "Compartilhar"}
                        </ItemMenuAcoes>
                        <div className="my-1 border-t border-base-600" />
                        <BotaoComConfirmacao
                          acao={() => chamarOuGuardar(() => arquivarConta(conta.id), pedidoArquivarConta(conta.id, conta.nome)).then(() => {})}
                          textoBotao={
                            <span className="flex items-center gap-2.5">
                              <Archive size={15} strokeWidth={2} /> Arquivar
                            </span>
                          }
                          textoConfirmacao={`Arquivar "${conta.nome}"? Ela some das listas, mas os dados continuam guardados — dá pra restaurar depois.`}
                          classeBotao="flex items-center w-full px-3.5 py-2 text-sm text-left text-ink-100 hover:bg-base-700 transition"
                          aoConcluir={() => {
                            recarregar();
                            fecharMenu();
                          }}
                        />
                        <BotaoComConfirmacao
                          acao={() =>
                            chamarOuGuardar(() => excluirContaDefinitivamente(conta.id), pedidoExcluirConta(conta.id, conta.nome)).then(() => {})
                          }
                          textoBotao={
                            <span className="flex items-center gap-2.5">
                              <Trash2 size={15} strokeWidth={2} /> Excluir de vez
                            </span>
                          }
                          textoConfirmacao={`Excluir "${conta.nome}" de vez? Isso apaga TODOS os lançamentos e recorrências dela, sem volta nenhuma.`}
                          classeBotao="flex items-center w-full px-3.5 py-2 text-sm text-left text-red-400 hover:bg-base-700 transition"
                          aoConcluir={() => {
                            recarregar();
                            fecharMenu();
                          }}
                        />
                      </>
                    )}
                  </MenuAcoes>
                </div>
              </div>
            </div>
              </LinhaComDeslizar>
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-lg font-semibold mb-3">Nova conta</h2>
      {erro && (
        <p className="mb-3 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">{erro}</p>
      )}
      {criada && (
        <p className="mb-3 text-sm text-habito bg-habito/10 border border-habito/30 rounded-lg px-3 py-2">
          Conta "{criada}" criada!
        </p>
      )}
      <form ref={formRef} action={aoCriar} className="space-y-3">
        <input
          name="nome"
          type="text"
          required
          placeholder="Ex: Carteira, Nubank, Cartão Inter"
          className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
        />
        <SeletorTipoConta />
        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Banco (pra mostrar o selo certo)</label>
          <select
            name="banco"
            className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
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
          className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
        />
        {/* Etapa 367 — quem divide as finanças escolhe se a conta nova é compartilhada */}
        {temParceiro && (
          <label className="flex items-center justify-between gap-3 bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 cursor-pointer">
            <span className="min-w-0">
              <span className="block text-sm text-ink-100">{compartilharNova ? "👥 Conta compartilhada" : "🔒 Conta particular"}</span>
              <span className="block text-xs text-ink-400">
                {compartilharNova ? "Os dois veem e lançam nela." : "Só você vê — o saldo e os lançamentos ficam de fora pra outra pessoa."}
              </span>
            </span>
            <input
              type="checkbox"
              checked={compartilharNova}
              onChange={(e) => setCompartilharNova(e.target.checked)}
              className="w-5 h-5 accent-financa shrink-0"
              aria-label="Tornar compartilhada"
            />
          </label>
        )}
        <BotaoSalvarFormulario textoEnviando="Criando...">Criar conta</BotaoSalvarFormulario>
      </form>
    </main>
  );
}

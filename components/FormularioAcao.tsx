"use client";

import { useRef, useState } from "react";

export type ResultadoAcao = { erro?: string } | void;

/**
 * Etapa 200 — formulário "à prova de falha calada". Antes, várias
 * telas mandavam o formulário direto pra uma Ação de Servidor que
 * redirecionava pra mesma página — e como essas telas leem do retrato
 * local, a lista não atualizava (parecia que não salvou) e o erro,
 * quando tinha, não aparecia em lugar nenhum.
 *
 * Aqui: a ação DEVOLVE { erro } em vez de redirecionar; o erro aparece
 * em vermelho, o sucesso em verde, a lista é recarregada (aoSucesso) e
 * o formulário limpa. Se a chamada em si falhar (sem internet, ou o
 * app aberto com uma versão antiga depois de uma atualização), avisa
 * e oferece recarregar o app.
 */
export function FormularioAcao({
  acao,
  aoSucesso,
  mensagemSucesso,
  className,
  children,
  limparAoSalvar = true,
}: {
  acao: (formData: FormData) => Promise<ResultadoAcao>;
  aoSucesso?: () => void | Promise<void>;
  mensagemSucesso?: string;
  className?: string;
  children: React.ReactNode;
  limparAoSalvar?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [versaoAntiga, setVersaoAntiga] = useState(false);
  const [ok, setOk] = useState(false);

  async function enviar(formData: FormData) {
    setErro(null);
    setOk(false);
    setVersaoAntiga(false);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErro("Sem internet — essa ação precisa de conexão.");
      return;
    }
    try {
      const r = await acao(formData);
      if (r && r.erro) {
        setErro(r.erro);
        registrarErro(r.erro);
        return;
      }
      setOk(true);
      if (limparAoSalvar) formRef.current?.reset();
      await aoSucesso?.();
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? "");
      registrarErro(msg || "falha na chamada");
      setVersaoAntiga(true);
      setErro("Não deu pra salvar. O app pode ter sido atualizado agora há pouco.");
    }
  }

  return (
    <>
      {erro && (
        <div className="mb-3 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {erro}
          {versaoAntiga && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="block mt-1.5 text-xs font-medium underline text-red-300"
            >
              Recarregar o app e tentar de novo
            </button>
          )}
        </div>
      )}
      {ok && mensagemSucesso && (
        <p className="mb-3 text-sm text-habito bg-habito/10 border border-habito/30 rounded-lg px-3 py-2">{mensagemSucesso}</p>
      )}
      <form ref={formRef} action={enviar} className={className}>
        {children}
      </form>
    </>
  );
}

function registrarErro(msg: string) {
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagina: `erro-form ${location.pathname}: ${msg}`.slice(0, 200) }),
    });
  } catch {}
}

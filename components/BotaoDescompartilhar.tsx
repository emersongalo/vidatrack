"use client";

// Etapa 303 — descompartilhar um hábito em dupla, com confirmação.
// Quem criou tira o par; quem foi convidado sai. O outro é avisado.
import { useState } from "react";
import { Unlink } from "lucide-react";
import { descompartilharHabito } from "@/lib/compartilhamento/actions";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";

export function BotaoDescompartilhar({
  habitoId,
  habitoNome,
  souDono,
  parceiro,
  compacto = false,
  aoConcluir,
}: {
  habitoId: string;
  habitoNome: string;
  souDono: boolean;
  parceiro: { id: string; nome: string };
  compacto?: boolean;
  aoConcluir?: (saiu: boolean) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);

  async function confirmar() {
    setIndo(true);
    setErro(null);
    const r = await descompartilharHabito(habitoId, souDono ? parceiro.id : null);
    setIndo(false);
    if (!r.ok) {
      setErro(r.erro ?? "Não deu certo");
      return;
    }
    setFeito(true);
    setAberto(false);
    await atualizarSnapshotEmTodasAsTelas();
    aoConcluir?.(!!r.saiu);
  }

  if (feito) return <p className="text-sm text-ink-400">Descompartilhado. {parceiro.nome} foi avisado(a).</p>;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={
          compacto
            ? "flex items-center gap-1.5 text-sm text-ink-400 hover:text-red-300 transition"
            : "flex items-center gap-1.5 text-sm text-red-300 border border-red-400/30 rounded-full px-3 py-1.5 hover:bg-red-400/10 transition"
        }
      >
        <Unlink size={14} /> {souDono ? `Descompartilhar com ${parceiro.nome}` : "Sair do hábito compartilhado"}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => !indo && setAberto(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-base-800 border border-base-600 p-5 animate-entrar" onClick={(e) => e.stopPropagation()}>
            <p className="text-3xl">💔</p>
            <p className="text-lg font-semibold mt-2">Tem certeza?</p>
            <p className="text-sm text-ink-300 mt-2">
              {souDono ? (
                <>
                  <strong>{parceiro.nome}</strong> deixa de fazer <strong>“{habitoNome}”</strong> com você. Ele(a) fica com uma cópia só dele(a), com o
                  próprio histórico, e você continua com o seu.
                </>
              ) : (
                <>
                  Você sai de <strong>“{habitoNome}”</strong>. Fica com uma cópia só sua, com todo o seu histórico, e <strong>{parceiro.nome}</strong>{" "}
                  continua com o dele(a).
                </>
              )}
            </p>
            <p className="text-sm text-ink-400 mt-2">A planta de vocês para de crescer e {parceiro.nome} recebe uma notificação.</p>
            {erro && <p className="text-sm text-red-400 mt-3">{erro}</p>}
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button type="button" disabled={indo} onClick={() => setAberto(false)} className="rounded-2xl py-3 border border-base-600 text-base">
                Cancelar
              </button>
              <button type="button" disabled={indo} onClick={() => void confirmar()} className="rounded-2xl py-3 bg-red-500 text-white font-semibold text-base disabled:opacity-60">
                {indo ? "..." : "Descompartilhar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

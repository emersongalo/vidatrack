"use client";

import { useEffect, useState } from "react";
import { conferirPin, pinAtivo, pinValido, removerPin, salvarPin } from "@/lib/seguranca/pin";

// Etapa 214 — liga/desliga o bloqueio por PIN (opcional, só neste aparelho)
type Modo = "parado" | "criar" | "trocar" | "desligar";

export function ConfigBloqueioPin() {
  const [ativo, setAtivo] = useState(false);
  const [modo, setModo] = useState<Modo>("parado");
  const [atual, setAtual] = useState("");
  const [novo, setNovo] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => setAtivo(pinAtivo()), []);

  const limpar = () => {
    setAtual("");
    setNovo("");
    setConfirma("");
    setErro(null);
  };

  const salvar = async () => {
    setErro(null);
    setOk(null);
    if (modo !== "criar" && !(await conferirPin(atual))) return setErro("PIN atual incorreto.");
    if (modo === "desligar") {
      removerPin();
      setAtivo(false);
      setModo("parado");
      limpar();
      return setOk("Bloqueio desligado.");
    }
    if (!pinValido(novo)) return setErro("O PIN precisa ter de 4 a 6 números.");
    if (novo !== confirma) return setErro("Os dois PINs não batem.");
    try {
      await salvarPin(novo);
    } catch {
      return setErro("Não foi possível salvar neste aparelho.");
    }
    setAtivo(true);
    setModo("parado");
    limpar();
    setOk(modo === "criar" ? "Bloqueio ligado!" : "PIN trocado!");
  };

  const campo = (valor: string, set: (v: string) => void, rotulo: string) => (
    <label className="block">
      <span className="block text-xs text-ink-400 mb-1">{rotulo}</span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={valor}
        onChange={(e) => set(e.target.value.replace(/\D/g, ""))}
        className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 font-mono tracking-[0.4em] outline-none focus:border-ink-100"
      />
    </label>
  );

  return (
    <section className="mt-10 pt-6 border-t border-base-600">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold">🔒 Bloqueio por PIN</h2>
          <p className="text-xs text-ink-400 mt-1">
            Opcional. Pede um PIN ao abrir o app e depois de 5 minutos fora dele. Vale só para este aparelho.
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${ativo ? "bg-habito-soft text-habito" : "bg-base-800 text-ink-400"}`}>
          {ativo ? "Ligado" : "Desligado"}
        </span>
      </div>

      {ok && <p className="mt-3 text-sm text-habito">{ok}</p>}

      {modo === "parado" ? (
        <div className="flex flex-wrap gap-2 mt-4">
          {!ativo ? (
            <button type="button" onClick={() => { setOk(null); setModo("criar"); }} className="px-4 py-2 rounded-lg bg-ink-100 text-base-900 text-sm font-medium">
              Ligar bloqueio
            </button>
          ) : (
            <>
              <button type="button" onClick={() => { setOk(null); setModo("trocar"); }} className="px-4 py-2 rounded-lg border border-base-600 text-sm">
                Trocar PIN
              </button>
              <button type="button" onClick={() => { setOk(null); setModo("desligar"); }} className="px-4 py-2 rounded-lg border border-red-400/40 text-red-400 text-sm">
                Desligar
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3 max-w-xs">
          {modo !== "criar" && campo(atual, setAtual, "PIN atual")}
          {modo !== "desligar" && campo(novo, setNovo, "Novo PIN (4 a 6 números)")}
          {modo !== "desligar" && campo(confirma, setConfirma, "Repita o novo PIN")}
          {erro && <p className="text-sm text-red-400">{erro}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={salvar} className="px-4 py-2 rounded-lg bg-ink-100 text-base-900 text-sm font-medium">
              {modo === "desligar" ? "Desligar bloqueio" : "Salvar PIN"}
            </button>
            <button type="button" onClick={() => { setModo("parado"); limpar(); }} className="px-4 py-2 rounded-lg border border-base-600 text-sm">
              Cancelar
            </button>
          </div>
          {modo === "criar" && (
            <p className="text-xs text-ink-400">Se esquecer o PIN, é só tocar em “Esqueci o PIN”: você sai da conta e entra de novo com seu login.</p>
          )}
        </div>
      )}
    </section>
  );
}

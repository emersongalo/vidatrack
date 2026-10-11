"use client";

// Etapa 303 — "Compartilhar com…" já na hora de criar um hábito ou uma
// tarefa. É opcional (vem desligado). Escolhe alguém com quem você já
// compartilha ou digita um e-mail; o convite sai junto com a criação e a
// pessoa recebe a notificação pra aceitar.
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { buscarPessoasConhecidas, type PessoaConhecida } from "@/lib/compartilhamento/conhecidas";

export function EscolherCompartilhar({ tipo }: { tipo: "habito" | "tarefa" }) {
  const [ligado, setLigado] = useState(false);
  const [pessoas, setPessoas] = useState<PessoaConhecida[] | null>(null);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [permissao, setPermissao] = useState(tipo === "tarefa" ? "edicao" : "leitura");

  useEffect(() => {
    if (!ligado || pessoas !== null) return;
    buscarPessoasConhecidas()
      .then(setPessoas)
      .catch(() => setPessoas([]));
  }, [ligado, pessoas]);

  const pessoa = pessoas?.find((p) => p.chave === escolhida) ?? null;

  return (
    <div className="rounded-2xl border border-base-600 bg-base-800/60 p-4 mt-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <span className="w-9 h-9 rounded-full bg-habito/15 text-habito flex items-center justify-center shrink-0">
          <Users size={17} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-base font-medium">Compartilhar com alguém?</span>
          <span className="block text-xs text-ink-400">
            {tipo === "habito" ? "Façam juntos: cada um marca o seu e a planta de vocês cresce." : "A pessoa vê a tarefa e pode marcar como feita."}
          </span>
        </span>
        <input
          type="checkbox"
          checked={ligado}
          onChange={(e) => {
            setLigado(e.target.checked);
            if (!e.target.checked) {
              setEscolhida(null);
              setEmail("");
            }
          }}
          className="w-5 h-5 accent-[rgb(var(--c-habito))]"
          aria-label="Compartilhar"
        />
      </label>

      {ligado && (
        <div className="mt-4 animate-surgir">
          {pessoas === null ? (
            <p className="text-sm text-ink-400">Carregando…</p>
          ) : (
            pessoas.length > 0 && (
              <>
                <p className="text-xs text-ink-400 mb-2">Com quem você já compartilha:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {pessoas.map((p) => (
                    <button
                      key={p.chave}
                      type="button"
                      onClick={() => {
                        setEscolhida((x) => (x === p.chave ? null : p.chave));
                        setEmail("");
                      }}
                      className={`flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border transition ${
                        escolhida === p.chave ? "border-habito bg-habito/15" : "border-base-600 bg-base-800"
                      }`}
                    >
                      <span className="w-7 h-7 rounded-full bg-habito/20 text-habito flex items-center justify-center text-xs font-semibold uppercase">{p.nome.slice(0, 1)}</span>
                      <span className="text-sm font-medium">{p.nome}</span>
                      {escolhida === p.chave && <span className="text-habito">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (e.target.value) setEscolhida(null);
            }}
            placeholder={pessoas?.length ? "ou o e-mail de outra pessoa" : "e-mail da pessoa"}
            className="w-full bg-base-900 border border-base-600 rounded-xl px-3 py-2.5 text-base text-ink-100 focus:border-habito outline-none"
          />
          <div className="flex gap-2 mt-3">
            {[
              ["leitura", "Pode ver"],
              ["edicao", "Pode editar"],
            ].map(([v, r]) => (
              <button
                key={v}
                type="button"
                onClick={() => setPermissao(v)}
                className={`flex-1 text-sm rounded-xl py-2 border ${permissao === v ? "border-ink-100 bg-base-700 font-medium" : "border-base-600 text-ink-400"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-400 mt-2">O convite sai quando você salvar — a pessoa recebe uma notificação pra aceitar.</p>
        </div>
      )}

      {/* o que vai junto com o formulário */}
      <input type="hidden" name="compartilharUsuario" value={ligado && pessoa?.usuarioId ? pessoa.usuarioId : ""} />
      <input type="hidden" name="compartilharEmail" value={ligado ? (pessoa && !pessoa.usuarioId ? pessoa.email ?? "" : email.trim()) : ""} />
      <input type="hidden" name="compartilharPermissao" value={permissao} />
    </div>
  );
}

"use client";

// Etapa 241 — no app Android: se tem versão nova na Play Store, mostra um
// aviso ao abrir com o botão que leva direto pra página do app na loja.
// No navegador/PWA não aparece (lá o site já atualiza sozinho).
import { useEffect, useState } from "react";
import { LINK_PLAY_STORE, VERSAO_NA_LOJA, podeMostrar, situacaoDaVersao, type SituacaoVersao } from "@/lib/app/versaoApp";

const CHAVE = "vidatrack-atualizacao-dispensada";

export function AvisoAtualizacaoApp() {
  const [situacao, setSituacao] = useState<SituacaoVersao>("atualizado");
  const [instalada, setInstalada] = useState<string | null>(null);

  useEffect(() => {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return;
    let cancelado = false;
    import("@capacitor/app")
      .then(({ App }) => App.getInfo())
      .then((info) => {
        if (cancelado) return;
        const s = situacaoDaVersao(info.build);
        if (s === "atualizado") return;
        if (s === "opcional") {
          let dispensado = null;
          try {
            dispensado = JSON.parse(localStorage.getItem(CHAVE) || "null");
          } catch {}
          if (!podeMostrar(dispensado, Date.now())) return;
        }
        setInstalada(info.version);
        setSituacao(s);
      })
      .catch(() => {
        /* app antigo sem o plugin: sem aviso */
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (situacao === "atualizado") return null;
  const obrigatoria = situacao === "obrigatoria";

  function dispensar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ codigo: VERSAO_NA_LOJA.codigo, em: Date.now() }));
    } catch {}
    setSituacao("atualizado");
  }

  return (
    <div className="animate-fundo fixed inset-0 z-[90] bg-black/60 flex items-end sm:items-center justify-center" onClick={obrigatoria ? undefined : dispensar}>
      <div
        className="animate-folha w-full max-w-md bg-base-800 border border-base-600 rounded-t-3xl sm:rounded-3xl p-6"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-3 animate-pop">📲</div>
        <h2 className="text-2xl font-display font-bold">{obrigatoria ? "Atualize o app pra continuar" : "Tem versão nova do VidaTrack!"}</h2>
        <p className="text-base text-ink-400 mt-1">
          {instalada ? `Você está na ${instalada}. ` : ""}A {VERSAO_NA_LOJA.nome} já está na Play Store.
        </p>
        {VERSAO_NA_LOJA.novidades.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {VERSAO_NA_LOJA.novidades.map((n) => (
              <li key={n} className="flex gap-2 text-base">
                <span className="text-habito">✓</span> {n}
              </li>
            ))}
          </ul>
        )}
        {/* link https da loja: o app abre no aplicativo da Play Store */}
        <a
          href={LINK_PLAY_STORE}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 w-full rounded-2xl bg-habito text-base-900 py-3.5 text-base font-semibold"
        >
          ▶ Atualizar na Play Store
        </a>
        {!obrigatoria && (
          <button type="button" onClick={dispensar} className="mt-2 w-full rounded-2xl py-3 text-base text-ink-400">
            Agora não
          </button>
        )}
      </div>
    </div>
  );
}

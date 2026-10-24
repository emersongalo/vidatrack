"use client";

// Etapa 241 — no app Android: se tem versão nova na Play Store, mostra um
// aviso ao abrir com o botão que leva direto pra atualização.
// Etapa 356 — AUTOMÁTICO: pergunta pro próprio Google Play (plugin oficial
// de atualização "in-app") se existe versão mais nova. Não precisa mais
// mudar número nenhum no código a cada versão. O botão abre a tela de
// atualização do Google Play por cima do app (ou a loja, se não der).
// Apps antigos (sem o plugin) continuam usando o aviso manual do
// lib/app/versaoApp.ts. No navegador/PWA não aparece (lá o site já
// atualiza sozinho).
import { useEffect, useState } from "react";
import { LINK_PLAY_STORE, VERSAO_NA_LOJA, podeMostrar, situacaoDaVersao, type SituacaoVersao } from "@/lib/app/versaoApp";
import { PedirAvaliacao } from "@/components/PedirAvaliacao";

const CHAVE = "vidatrack-atualizacao-dispensada";
// valores do Google Play (AppUpdateAvailability)
const DISPONIVEL = 2;
const EM_ANDAMENTO = 3;

type Origem = { tipo: "play"; codigo: number; imediata: boolean } | { tipo: "manual" };

function lerDispensado(): { codigo: number; em: number } | null {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || "null");
  } catch {
    return null;
  }
}

async function pluginAtualizacao() {
  const { AppUpdate } = await import("@capawesome/capacitor-app-update");
  return AppUpdate;
}

export function AvisoAtualizacaoApp() {
  const [situacao, setSituacao] = useState<SituacaoVersao>("atualizado");
  const [instalada, setInstalada] = useState<string | null>(null);
  const [origem, setOrigem] = useState<Origem>({ tipo: "manual" });
  const [abrindo, setAbrindo] = useState(false);

  useEffect(() => {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return;
    if (navigator.onLine === false) return; // sem internet não dá pra atualizar mesmo
    let cancelado = false;

    async function verificar() {
      const { App } = await import("@capacitor/app");
      const info = await App.getInfo().catch(() => null);
      if (cancelado) return;

      // 1) automático: o Google Play diz se tem versão nova
      try {
        const AppUpdate = await pluginAtualizacao();
        const r = await AppUpdate.getAppUpdateInfo();
        if (cancelado) return;
        if (r.updateAvailability === EM_ANDAMENTO) {
          // já começou a baixar antes: retoma a atualização
          if (r.immediateUpdateAllowed) void AppUpdate.performImmediateUpdate().catch(() => {});
          return;
        }
        if (r.updateAvailability !== DISPONIVEL) return; // está em dia
        const codigo = Number(r.availableVersionCode) || 0;
        const obrigatoria = situacaoDaVersao(info?.build) === "obrigatoria";
        if (!obrigatoria) {
          const d = lerDispensado();
          // "Agora não" vale 3 dias pra aquela versão
          if (d && d.codigo === codigo && Date.now() - d.em < 3 * 24 * 3600 * 1000) return;
        }
        setOrigem({ tipo: "play", codigo, imediata: !!r.immediateUpdateAllowed });
        setInstalada(info?.version ?? null);
        setSituacao(obrigatoria ? "obrigatoria" : "opcional");
        return;
      } catch {
        // app antigo (sem o plugin) ou Google Play indisponível: aviso manual abaixo
      }

      // 2) manual (versões antigas do app): número em lib/app/versaoApp.ts
      if (!info) return;
      const s = situacaoDaVersao(info.build);
      if (s === "atualizado") return;
      if (s === "opcional" && !podeMostrar(lerDispensado(), Date.now())) return;
      setOrigem({ tipo: "manual" });
      setInstalada(info.version);
      setSituacao(s);
    }

    void verificar().catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  // Etapa 363 — o pedido de avaliação mora junto (já está em todas as telas)
  if (situacao === "atualizado") return <PedirAvaliacao />;
  const obrigatoria = situacao === "obrigatoria";
  // novidades escritas à mão só quando batem com a versão que está na loja
  const novidades = origem.tipo === "manual" || origem.codigo === VERSAO_NA_LOJA.codigo ? VERSAO_NA_LOJA.novidades : [];

  function dispensar() {
    try {
      const codigo = origem.tipo === "play" ? origem.codigo : VERSAO_NA_LOJA.codigo;
      localStorage.setItem(CHAVE, JSON.stringify({ codigo, em: Date.now() }));
    } catch {}
    setSituacao("atualizado");
  }

  async function atualizar() {
    if (origem.tipo !== "play") return; // manual: o link <a> abre a loja
    setAbrindo(true);
    try {
      const AppUpdate = await pluginAtualizacao();
      // tela de atualização do Google Play por cima do app (baixa e reinicia)
      if (origem.imediata) await AppUpdate.performImmediateUpdate();
      else await AppUpdate.openAppStore();
    } catch {
      window.open(LINK_PLAY_STORE, "_blank");
    }
    setAbrindo(false);
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
          {instalada ? `Você está na ${instalada}. ` : ""}
          {origem.tipo === "manual" ? `A ${VERSAO_NA_LOJA.nome} já está na Play Store.` : "A versão nova já está na Play Store."}
        </p>
        {novidades.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {novidades.map((n) => (
              <li key={n} className="flex gap-2 text-base">
                <span className="text-habito">✓</span> {n}
              </li>
            ))}
          </ul>
        )}
        {origem.tipo === "play" ? (
          <button
            type="button"
            onClick={() => void atualizar()}
            disabled={abrindo}
            className="mt-6 flex items-center justify-center gap-2 w-full rounded-2xl bg-habito text-base-900 py-3.5 text-base font-semibold disabled:opacity-60"
          >
            {abrindo ? "Abrindo…" : "▶ Atualizar agora"}
          </button>
        ) : (
          // link https da loja: o app abre no aplicativo da Play Store
          <a
            href={LINK_PLAY_STORE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 w-full rounded-2xl bg-habito text-base-900 py-3.5 text-base font-semibold"
          >
            ▶ Atualizar na Play Store
          </a>
        )}
        {!obrigatoria && (
          <button type="button" onClick={dispensar} className="mt-2 w-full rounded-2xl py-3 text-base text-ink-400">
            Agora não
          </button>
        )}
      </div>
    </div>
  );
}

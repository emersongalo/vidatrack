"use client";

import { useEffect, useState } from "react";
import { salvarInscricaoPush, removerInscricaoPush } from "@/app/notificacoes/actions";

function urlBase64ParaUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Segura = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(base64Segura);
  const array = new Uint8Array(bruto.length);
  for (let i = 0; i < bruto.length; i++) array[i] = bruto.charCodeAt(i);
  return array;
}

export function BotaoAtivarNotificacoes() {
  const [suportado, setSuportado] = useState(true);
  const [inscrito, setInscrito] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSuportado(false);
      return;
    }
    navigator.serviceWorker.ready.then(async (registro) => {
      const inscricaoAtual = await registro.pushManager.getSubscription();
      setInscrito(!!inscricaoAtual);
    });
  }, []);

  async function ativar() {
    setCarregando(true);
    setErro("");
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setErro("Permissão negada. Ative nas configurações do navegador para continuar.");
        setCarregando(false);
        return;
      }

      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ParaUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const json = inscricao.toJSON();
      await salvarInscricaoPush({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });

      setInscrito(true);
    } catch {
      setErro("Não foi possível ativar. Tenta de novo em alguns instantes.");
    }
    setCarregando(false);
  }

  async function desativar() {
    setCarregando(true);
    const registro = await navigator.serviceWorker.ready;
    const inscricao = await registro.pushManager.getSubscription();
    if (inscricao) {
      await removerInscricaoPush(inscricao.endpoint);
      await inscricao.unsubscribe();
    }
    setInscrito(false);
    setCarregando(false);
  }

  if (!suportado) {
    return (
      <p className="text-sm text-ink-400">
        Seu navegador não suporta notificações push (comum em algumas
        versões do iOS/Safari fora do modo "instalado como app").
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={inscrito ? desativar : ativar}
        disabled={carregando}
        className={`text-sm font-medium rounded-lg px-4 py-2.5 transition disabled:opacity-50 ${
          inscrito
            ? "border border-base-600 hover:bg-base-800"
            : "bg-ink-100 text-base-900 hover:opacity-90"
        }`}
      >
        {carregando ? "Um instante..." : inscrito ? "Desativar notificações" : "Ativar notificações"}
      </button>
      {erro && <p className="text-red-400 text-sm mt-2">{erro}</p>}
    </div>
  );
}

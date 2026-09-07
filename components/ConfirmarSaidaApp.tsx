"use client";

import { useEffect, useState } from "react";

export function ConfirmarSaidaApp() {
  const [avisoVisivel, setAvisoVisivel] = useState(false);

  useEffect(() => {
    let prontoParaSair = false;
    let idTimeout: ReturnType<typeof setTimeout>;
    let removerListener: (() => void) | null = null;
    let cancelado = false;

    async function configurar() {
      // O botão físico de voltar do Android, dentro do app instalado,
      // não é a mesma coisa que o "voltar" do navegador — o truque
      // antigo (empilhar um estado extra no histórico) tinha um bug
      // real: no segundo toque, o Android já tinha navegado de
      // verdade pra página anterior ANTES do nosso código conseguir
      // reagir, então o aviso aparecia mas o app "voltava" mesmo
      // assim. O jeito certo é interceptar o botão físico direto,
      // via o plugin do Capacitor — só existe dentro do app nativo,
      // por isso os imports são dinâmicos e tudo dentro de um
      // try/catch (no navegador comum, isso simplesmente não roda).
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        if (cancelado) return;

        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("backButton", () => {
          if (prontoParaSair) {
            App.exitApp();
            return;
          }
          setAvisoVisivel(true);
          prontoParaSair = true;
          clearTimeout(idTimeout);
          idTimeout = setTimeout(() => {
            prontoParaSair = false;
            setAvisoVisivel(false);
          }, 2200);
        });
        removerListener = () => handle.remove();
      } catch {
        // Pacotes nativos ainda não instalados/sincronizados, ou
        // rodando fora do app — sem problema, só não ativa isso aqui.
      }
    }

    configurar();

    return () => {
      cancelado = true;
      clearTimeout(idTimeout);
      removerListener?.();
    };
  }, []);

  if (!avisoVisivel) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 flex justify-center pointer-events-none">
      <div className="bg-base-800 border border-base-600 rounded-full px-4 py-2.5 text-sm shadow-lg">
        Toque em voltar de novo pra sair do VidaTrack
      </div>
    </div>
  );
}

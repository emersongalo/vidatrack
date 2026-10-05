"use client";

// Etapa 266 — botão físico de voltar do Android, em TODAS as telas.
// Antes só o Início tratava esse botão; nas outras telas (ex: Tarefas,
// quando a tela foi aberta direto, sem histórico) ele não fazia nada.
// Agora:
// - no Início: "toque de novo pra sair" (como antes);
// - nas outras telas: volta pra tela anterior; se não tiver pra onde
//   voltar, sobe pra tela "de cima" (Tarefas → Início, uma tarefa → Tarefas…).
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const RAIZ = "/dashboard";
const TELAS_DE_SAIDA = ["/dashboard", "/", "/login", "/bem-vindo"];
const AREAS = ["/habitos", "/tarefas", "/financas", "/perfil", "/notificacoes", "/buscar", "/novidades", "/retrospectiva", "/ajuda", "/convidar"];

export function telaDeCima(caminho: string): string {
  if (AREAS.includes(caminho)) return RAIZ;
  const partes = caminho.split("/").filter(Boolean);
  partes.pop();
  const pai = "/" + partes.join("/");
  return pai === "/" ? RAIZ : pai;
}

export function BotaoVoltarApp() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const caminho = useRef(pathname);
  const [aviso, setAviso] = useState(false);
  caminho.current = pathname;

  useEffect(() => {
    let cancelado = false;
    let remover: (() => void) | null = null;
    let prontoParaSair = false;
    let tempo: ReturnType<typeof setTimeout>;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform() || cancelado) return;
        const { App } = await import("@capacitor/app");
        const h = await App.addListener("backButton", ({ canGoBack }) => {
          const agora = caminho.current;

          // folha/janela aberta por cima? fecha ela primeiro (Esc é o "fechar" das folhas)
          const folha = document.querySelector(".animate-folha");
          if (folha) {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            (document.querySelector(".animate-fundo") as HTMLElement | null)?.click();
            // se a folha não fechou sozinha, segue o voltar normal
            setTimeout(() => {
              if (document.querySelector(".animate-folha") === folha) voltar(agora, canGoBack);
            }, 150);
            return;
          }
          voltar(agora, canGoBack);
        });

        function voltar(agora: string, canGoBack: boolean) {
          if (TELAS_DE_SAIDA.includes(agora)) {
            if (prontoParaSair) {
              App.exitApp();
              return;
            }
            prontoParaSair = true;
            setAviso(true);
            clearTimeout(tempo);
            tempo = setTimeout(() => {
              prontoParaSair = false;
              setAviso(false);
            }, 2200);
            return;
          }

          if (canGoBack && window.history.length > 1) {
            window.history.back();
            // se o histórico não levou a lugar nenhum, sobe pra tela de cima
            setTimeout(() => {
              if (caminho.current === agora) router.push(telaDeCima(agora));
            }, 400);
          } else {
            router.push(telaDeCima(agora));
          }
        }
        remover = () => h.remove();
      } catch {
        // fora do app nativo: o navegador cuida do voltar
      }
    })();

    return () => {
      cancelado = true;
      clearTimeout(tempo);
      remover?.();
    };
  }, [router]);

  if (!aviso) return null;
  return (
    <div className="fixed bottom-28 left-4 right-4 z-[60] flex justify-center pointer-events-none">
      <div className="animate-surgir bg-base-800 border border-base-600 rounded-full px-4 py-2.5 text-sm shadow-lg">
        Toque em voltar de novo pra sair do VidaTrack
      </div>
    </div>
  );
}

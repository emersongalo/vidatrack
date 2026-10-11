// Etapa 292 — ponte com o plugin nativo "UsoTela" (só no app Android
// com a versão nova). No navegador ou app antigo, tudo devolve "indisponível".
import { registerPlugin } from "@capacitor/core";
import type { DiaUso } from "@/lib/tela/categorias";

type UsoTelaAPI = {
  temPermissao: () => Promise<{ permitido: boolean }>;
  abrirConfiguracao: () => Promise<void>;
  usoPorDia: (o: { dias: number }) => Promise<{ dias: DiaUso[] }>;
};

let plugin: UsoTelaAPI | null = null;
function obter(): UsoTelaAPI | null {
  if (typeof window === "undefined") return null;
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== "android") return null;
  if (!plugin) plugin = registerPlugin<UsoTelaAPI>("UsoTela");
  return plugin;
}

export type EstadoTela = "indisponivel" | "sem_permissao" | "ok";

/** "indisponivel" = navegador, iPhone ou app antigo sem o plugin. */
export async function estadoTela(): Promise<EstadoTela> {
  const p = obter();
  if (!p) return "indisponivel";
  try {
    const r = await p.temPermissao();
    return r.permitido ? "ok" : "sem_permissao";
  } catch {
    return "indisponivel";
  }
}

export async function abrirPermissaoTela(): Promise<void> {
  try {
    await obter()?.abrirConfiguracao();
  } catch {}
}

export async function lerUsoPorDia(dias = 7): Promise<DiaUso[] | null> {
  const p = obter();
  if (!p) return null;
  try {
    const r = await p.usoPorDia({ dias });
    return (r?.dias ?? []) as DiaUso[];
  } catch {
    return null;
  }
}

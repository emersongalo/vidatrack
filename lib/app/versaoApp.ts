// Etapa 241 — aviso de "tem versão nova do app na Play Store".
//
// COMO USAR: depois que a versão nova do AAB estiver PUBLICADA na Play
// Store (não antes — senão a pessoa vai pra loja e não acha atualização),
// suba o número abaixo pro mesmo versionCode do android/app/build.gradle
// e publique o site. Quem abrir o app com uma versão menor vê o aviso.
//
// VERSAO_MINIMA: só aumente quando a versão antiga do app PARAR de
// funcionar (ex: mudou algo no app nativo que o site precisa). Abaixo
// dela, o aviso não deixa fechar.
export const VERSAO_NA_LOJA = {
  codigo: 41,
  nome: "1.1.0",
  novidades: ["Barra de cima do celular com a cor da tela", "Widgets abrindo na página certa"],
};
export const VERSAO_MINIMA = 0;

export const PACOTE_ANDROID = "com.vidatrack.app";
export const LINK_PLAY_STORE = `https://play.google.com/store/apps/details?id=${PACOTE_ANDROID}`;

export type SituacaoVersao = "atualizado" | "opcional" | "obrigatoria";

/** build = versionCode do app instalado (vem do App.getInfo().build) */
export function situacaoDaVersao(build: string | number | null | undefined): SituacaoVersao {
  const n = Number(build);
  if (!Number.isFinite(n) || n <= 0) return "atualizado"; // não deu pra saber: não incomoda
  if (n < VERSAO_MINIMA) return "obrigatoria";
  if (n < VERSAO_NA_LOJA.codigo) return "opcional";
  return "atualizado";
}

const TRES_DIAS = 3 * 24 * 3600 * 1000;
/** "Agora não" vale por 3 dias pra aquela versão */
export function podeMostrar(dispensado: { codigo: number; em: number } | null, agora: number): boolean {
  if (!dispensado) return true;
  if (dispensado.codigo !== VERSAO_NA_LOJA.codigo) return true;
  return agora - dispensado.em > TRES_DIAS;
}

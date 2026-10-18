// Etapa 326 — música e sons da ilha (pacote Ninja Adventure, CC0).
// Começa desligado; a escolha fica guardada no aparelho.
const CHAVE = "vt-ilha-som";
export type Som = "moeda" | "falar" | "entrar" | "sucesso" | "bau";

export function somLigado(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}
export function guardarSom(ligado: boolean) {
  try {
    localStorage.setItem(CHAVE, ligado ? "1" : "0");
  } catch {}
}

let musica: HTMLAudioElement | null = null;
export function tocarMusica(noite: boolean) {
  if (typeof Audio === "undefined") return;
  const src = noite ? "/ilha/som/musica-noite.mp3" : "/ilha/som/musica-dia.mp3";
  if (musica && musica.src.endsWith(src)) {
    void musica.play().catch(() => {});
    return;
  }
  pararMusica();
  musica = new Audio(src);
  musica.loop = true;
  musica.volume = 0.32;
  void musica.play().catch(() => {});
}
export function pararMusica() {
  if (musica) {
    musica.pause();
    musica = null;
  }
}

const cache = new Map<Som, HTMLAudioElement>();
export function tocar(som: Som) {
  if (typeof Audio === "undefined" || !somLigado()) return;
  try {
    let a = cache.get(som);
    if (!a) {
      a = new Audio(`/ilha/som/${som}.mp3`);
      a.volume = 0.55;
      cache.set(som, a);
    }
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {}
}

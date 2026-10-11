// Etapa 292 — tempo de tela: categorias dos apps e contas do dia.
// Funções puras (testáveis); os minutos vêm do plugin nativo UsoTela.

export type AppUso = { pacote: string; nome: string; minutos: number; categoria?: number };
export type DiaUso = { dia: string; apps: AppUso[] };

export type CategoriaTela = "redes" | "video" | "mensagens" | "jogos" | "musica" | "outros";

export const CATEGORIAS_TELA: { id: CategoriaTela; nome: string; emoji: string; cor: string }[] = [
  { id: "redes", nome: "Redes sociais", emoji: "📱", cor: "#E1306C" },
  { id: "video", nome: "Vídeo e streaming", emoji: "🎬", cor: "#F87171" },
  { id: "jogos", nome: "Jogos", emoji: "🎮", cor: "#9C8FD9" },
  { id: "mensagens", nome: "Mensagens", emoji: "💬", cor: "#25D366" },
  { id: "musica", nome: "Música e áudio", emoji: "🎧", cor: "#D9A24C" },
  { id: "outros", nome: "Outros", emoji: "🧩", cor: "#8A8F98" },
];

const CONHECIDOS: Record<string, CategoriaTela> = {
  // redes
  "com.instagram.android": "redes",
  "com.instagram.barcelona": "redes", // Threads
  "com.instagram.lite": "redes",
  "com.facebook.katana": "redes",
  "com.facebook.lite": "redes",
  "com.zhiliaoapp.musically": "redes", // TikTok
  "com.ss.android.ugc.trill": "redes",
  "com.zhiliaoapp.musically.go": "redes",
  "com.twitter.android": "redes",
  "com.snapchat.android": "redes",
  "com.pinterest": "redes",
  "com.linkedin.android": "redes",
  "com.reddit.frontpage": "redes",
  "com.kwai.video": "redes",
  "com.kwai.bulldog": "redes",
  "com.tumblr": "redes",
  "com.bereal.ft": "redes",
  "com.vk.vkvideo": "redes",
  // vídeo
  "com.google.android.youtube": "video",
  "com.google.android.apps.youtube.kids": "video",
  "com.netflix.mediaclient": "video",
  "com.amazon.avod.thirdpartyclient": "video",
  "com.disney.disneyplus": "video",
  "com.wbd.stream": "video",
  "com.hbo.hbonow": "video",
  "tv.twitch.android.app": "video",
  "com.globo.globotv": "video",
  "com.crunchyroll.crunchyroid": "video",
  "com.apple.atve.androidtv.appletv": "video",
  "tv.pluto.android": "video",
  // mensagens
  "com.whatsapp": "mensagens",
  "com.whatsapp.w4b": "mensagens",
  "org.telegram.messenger": "mensagens",
  "org.thunderdog.challegram": "mensagens",
  "com.facebook.orca": "mensagens",
  "com.discord": "mensagens",
  "com.google.android.apps.messaging": "mensagens",
  "org.thoughtcrime.securesms": "mensagens", // Signal
  // música
  "com.spotify.music": "musica",
  "com.google.android.apps.youtube.music": "musica",
  "deezer.android.app": "musica",
  "com.amazon.mp3": "musica",
  "com.soundcloud.android": "musica",
};

/** Categoria do Android (ApplicationInfo.category): 0 jogo, 1 áudio, 2 vídeo, 4 social. */
export function categoriaDoApp(app: Pick<AppUso, "pacote" | "categoria">): CategoriaTela {
  const conhecida = CONHECIDOS[app.pacote];
  if (conhecida) return conhecida;
  switch (app.categoria) {
    case 0:
      return "jogos";
    case 1:
      return "musica";
    case 2:
      return "video";
    case 4:
      return "redes";
    default:
      return "outros";
  }
}

export function formatarMinutos(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${String(r).padStart(2, "0")}min` : `${h}h`;
}

export type ResumoTela = {
  total: number;
  porCategoria: { id: CategoriaTela; nome: string; emoji: string; cor: string; minutos: number }[];
  topApps: (AppUso & { cat: CategoriaTela })[];
};

export function resumirDia(apps: AppUso[]): ResumoTela {
  const soma = new Map<CategoriaTela, number>();
  let total = 0;
  for (const a of apps) {
    const c = categoriaDoApp(a);
    soma.set(c, (soma.get(c) ?? 0) + a.minutos);
    total += a.minutos;
  }
  return {
    total: Math.round(total),
    porCategoria: CATEGORIAS_TELA.map((c) => ({ ...c, minutos: Math.round(soma.get(c.id) ?? 0) }))
      .filter((c) => c.minutos > 0)
      .sort((a, b) => b.minutos - a.minutos),
    topApps: [...apps]
      .sort((a, b) => b.minutos - a.minutos)
      .map((a) => ({ ...a, cat: categoriaDoApp(a) })),
  };
}

/** Minutos de um dia somando só as categorias escolhidas. */
export function minutosNasCategorias(apps: AppUso[], categorias: CategoriaTela[]): number {
  const alvo = new Set(categorias);
  return Math.round(apps.filter((a) => alvo.has(categoriaDoApp(a))).reduce((s, a) => s + a.minutos, 0));
}

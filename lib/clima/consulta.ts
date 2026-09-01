// Mapa dos "weather codes" da Open-Meteo (padrão WMO) pra emoji + texto
// em português. Lista resumida com os códigos mais comuns.
const CODIGOS_TEMPO: Record<number, { emoji: string; texto: string }> = {
  0: { emoji: "☀️", texto: "Céu limpo" },
  1: { emoji: "🌤️", texto: "Poucas nuvens" },
  2: { emoji: "⛅", texto: "Parcialmente nublado" },
  3: { emoji: "☁️", texto: "Nublado" },
  45: { emoji: "🌫️", texto: "Neblina" },
  48: { emoji: "🌫️", texto: "Neblina" },
  51: { emoji: "🌦️", texto: "Garoa leve" },
  53: { emoji: "🌦️", texto: "Garoa" },
  55: { emoji: "🌦️", texto: "Garoa forte" },
  61: { emoji: "🌧️", texto: "Chuva leve" },
  63: { emoji: "🌧️", texto: "Chuva" },
  65: { emoji: "🌧️", texto: "Chuva forte" },
  80: { emoji: "🌦️", texto: "Pancadas de chuva" },
  81: { emoji: "🌧️", texto: "Pancadas de chuva" },
  82: { emoji: "⛈️", texto: "Pancadas fortes" },
  95: { emoji: "⛈️", texto: "Trovoadas" },
  96: { emoji: "⛈️", texto: "Trovoadas com granizo" },
  99: { emoji: "⛈️", texto: "Trovoadas fortes" },
};

export function traduzirCodigoTempo(codigo: number) {
  return CODIGOS_TEMPO[codigo] ?? { emoji: "🌡️", texto: "—" };
}

export type DiaPrevisao = {
  data: string;
  tempMax: number;
  tempMin: number;
  codigo: number;
};

export async function buscarPrevisaoTempo(
  latitude: number,
  longitude: number
): Promise<DiaPrevisao[] | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "7");

    const resposta = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!resposta.ok) return null;

    const dados = await resposta.json();
    const dias: DiaPrevisao[] = dados.daily.time.map((data: string, i: number) => ({
      data,
      tempMax: Math.round(dados.daily.temperature_2m_max[i]),
      tempMin: Math.round(dados.daily.temperature_2m_min[i]),
      codigo: dados.daily.weather_code[i],
    }));

    return dias;
  } catch {
    return null;
  }
}

export async function buscarCidadesPorNome(nome: string) {
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", nome);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", "pt");

    const resposta = await fetch(url.toString());
    if (!resposta.ok) return [];

    const dados = await resposta.json();
    return (dados.results ?? []).map((r: any) => ({
      nome: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  } catch {
    return [];
  }
}

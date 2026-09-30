// Etapa 233 — a carinha do hábito em dupla: muda de cara conforme o dia
// de vocês (festa, esperando, preocupada, triste) e pisca sozinha.
import type { HumorDupla } from "@/lib/habitos/dupla";

const CORES: Record<HumorDupla, { rosto: string; borda: string }> = {
  festa: { rosto: "#FFD24D", borda: "#E0A800" },
  esperandoParceiro: { rosto: "#A7E08A", borda: "#6DB04C" },
  esperandoVoce: { rosto: "#FFC870", borda: "#E09A2E" },
  tranquilo: { rosto: "#EFE3BE", borda: "#C9B886" },
  preocupado: { rosto: "#FFB27A", borda: "#E07B38" },
  triste: { rosto: "#9CC3F0", borda: "#5E8FCC" },
};

const CAIXA: React.CSSProperties = { transformBox: "fill-box", transformOrigin: "center" };

export function CarinhaDupla({ humor, tamanho = 40, className = "" }: { humor: HumorDupla; tamanho?: number; className?: string }) {
  const cor = CORES[humor];
  const olhosFelizes = humor === "festa";
  const tinta = "#3A2A1A";

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Carinha: ${humor}`}
      className={`${humor === "festa" ? "animate-pular" : ""} shrink-0 overflow-visible ${className}`}
      style={CAIXA}
    >
      {/* confete da festa */}
      {humor === "festa" && (
        <g>
          <circle cx="6" cy="10" r="2.5" fill="#FF6B8A" className="animate-pulse" />
          <circle cx="58" cy="8" r="2" fill="#4CC9F0" className="animate-pulse" />
          <rect x="54" y="52" width="4" height="4" rx="1" fill="#7BD389" className="animate-pulse" />
          <rect x="4" y="50" width="3.5" height="3.5" rx="1" fill="#B38CFF" className="animate-pulse" />
        </g>
      )}

      <circle cx="32" cy="32" r="27" fill={cor.rosto} stroke={cor.borda} strokeWidth="2.5" />

      {/* bochechas */}
      {(humor === "festa" || humor === "esperandoParceiro") && (
        <>
          <ellipse cx="17" cy="38" rx="5" ry="3" fill="#FF8FA3" opacity="0.55" />
          <ellipse cx="47" cy="38" rx="5" ry="3" fill="#FF8FA3" opacity="0.55" />
        </>
      )}

      {/* olhos */}
      {olhosFelizes ? (
        <g stroke={tinta} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M18 27 Q23 20 28 27" />
          <path d="M36 27 Q41 20 46 27" />
        </g>
      ) : (
        <g className={humor === "esperandoVoce" ? "animate-olhar" : ""} style={CAIXA}>
          <g className="animate-piscar" style={CAIXA}>
            <ellipse cx="23" cy="26" rx="3.4" ry={humor === "triste" ? 3.6 : 4.4} fill={tinta} />
            <ellipse cx="41" cy="26" rx="3.4" ry={humor === "triste" ? 3.6 : 4.4} fill={tinta} />
            <circle cx="24.3" cy="24.4" r="1.2" fill="#fff" />
            <circle cx="42.3" cy="24.4" r="1.2" fill="#fff" />
          </g>
        </g>
      )}

      {/* sobrancelhas de preocupação/tristeza */}
      {(humor === "preocupado" || humor === "triste") && (
        <g stroke={tinta} strokeWidth="2.4" strokeLinecap="round">
          <path d="M17 18 L27 15.5" />
          <path d="M47 18 L37 15.5" />
        </g>
      )}

      {/* boca */}
      {humor === "festa" && (
        <g>
          <path d="M19 37 Q32 54 45 37 Z" fill={tinta} />
          <path d="M26 45.5 Q32 50 38 45.5 Q32 43 26 45.5 Z" fill="#FF6B7A" />
        </g>
      )}
      {humor === "esperandoParceiro" && <path d="M21 39 Q32 49 43 39" stroke={tinta} strokeWidth="3.2" strokeLinecap="round" fill="none" />}
      {humor === "esperandoVoce" && <path d="M24 41 Q32 46 40 41" stroke={tinta} strokeWidth="3.2" strokeLinecap="round" fill="none" />}
      {humor === "tranquilo" && <path d="M25 42 L39 42" stroke={tinta} strokeWidth="3.2" strokeLinecap="round" />}
      {humor === "preocupado" && (
        <path d="M22 44 Q25 40 28 44 Q31 48 34 44 Q37 40 40 44" stroke={tinta} strokeWidth="2.8" strokeLinecap="round" fill="none" />
      )}
      {humor === "triste" && <path d="M22 46 Q32 37 42 46" stroke={tinta} strokeWidth="3.2" strokeLinecap="round" fill="none" />}

      {/* lágrima */}
      {humor === "triste" && (
        <path d="M41 31 Q38.5 35.5 41 37.5 Q43.5 35.5 41 31 Z" fill="#3D8BFF" className="animate-lagrima" style={CAIXA} />
      )}
      {/* gota de suor */}
      {humor === "preocupado" && (
        <path d="M52 14 Q48.5 20 52 22.5 Q55.5 20 52 14 Z" fill="#6EC3FF" stroke="#3D8BFF" strokeWidth="0.8" className="animate-pulse" />
      )}
      {/* "?" de quem espera */}
      {humor === "esperandoParceiro" && (
        <text x="52" y="14" fontSize="13" fontWeight="700" fill={cor.borda} className="animate-pulse">
          ?
        </text>
      )}
    </svg>
  );
}

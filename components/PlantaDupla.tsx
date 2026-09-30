// Etapa 233 — o "jardim" da dupla: cada hábito compartilhado tem uma
// plantinha que cresce com os dias em que TODOS fizeram (semente →
// broto → … → árvore) e murcha um pouco quando ninguém faz. Ela nunca
// morre: volta a ficar viçosa quando vocês retomam.
const CAIXA: React.CSSProperties = { transformBox: "fill-box", transformOrigin: "50% 100%" };

const FOLHA = ["#4CAF50", "#9DB54A", "#B89B4A"]; // viçosa, murchando, murcha (índice = 2 - saúde)

function Folha({ x, y, lado, tamanho, cor, murcha }: { x: number; y: number; lado: -1 | 1; tamanho: number; cor: string; murcha: number }) {
  // murcha: 0 (em pé) a 2 (caída)
  const angulo = lado * (-35 + murcha * 35);
  return (
    <g transform={`translate(${x} ${y}) rotate(${angulo})`}>
      <path d={`M0 0 Q${lado * tamanho * 0.55} ${-tamanho * 0.55} ${lado * tamanho} 0 Q${lado * tamanho * 0.55} ${tamanho * 0.35} 0 0 Z`} fill={cor} />
      <path d={`M0 0 L${lado * tamanho * 0.8} ${-tamanho * 0.05}`} stroke="#2E7D32" strokeWidth="0.8" opacity="0.5" />
    </g>
  );
}

function Flor({ x, y, r, cor }: { x: number; y: number; r: number; cor: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy={-r} rx={r * 0.62} ry={r} fill={cor} transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.62} fill="#FFD24D" />
    </g>
  );
}

export function PlantaDupla({
  estagio,
  saude,
  tamanho = 96,
  className = "",
}: {
  estagio: number;
  saude: 0 | 1 | 2;
  tamanho?: number;
  className?: string;
}) {
  const murcha = 2 - saude;
  const cor = FOLHA[murcha];
  const caule = murcha === 2 ? "#8D7A45" : "#3E8E41";
  // altura do caule por estágio
  const altura = [0, 10, 20, 32, 40, 46, 0][estagio] ?? 0;
  const topoY = 70 - altura;

  return (
    <svg width={tamanho} height={tamanho * 1.2} viewBox="0 0 80 96" role="img" aria-label="Plantinha da dupla" className={className}>
      <g className={saude === 2 && estagio > 0 ? "animate-balancar" : ""} style={CAIXA}>
        {/* Etapa 236 — semente mais visível: montinho de terra, semente e um brilho */}
        {estagio === 0 && (
          <g>
            <ellipse cx="40" cy="66" rx="11" ry="4.5" fill="#6B4226" />
            <ellipse cx="40" cy="61.5" rx="5.5" ry="4" fill="#A0673A" />
            <ellipse cx="38.3" cy="60.3" rx="1.6" ry="1" fill="#E6B98A" opacity="0.8" />
            <path d="M40 57.8 Q41.5 55 43.5 55.5" stroke="#6DBE6B" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        )}

        {estagio >= 1 && estagio <= 5 && (
          <g style={{ ...CAIXA, transform: murcha === 2 ? "rotate(8deg)" : undefined }}>
            <path d={`M40 70 Q${murcha ? 43 : 41} ${70 - altura / 2} 40 ${topoY}`} stroke={caule} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <Folha x={40} y={topoY + 2} lado={-1} tamanho={estagio === 1 ? 7 : 10} cor={cor} murcha={murcha} />
            <Folha x={40} y={topoY + 2} lado={1} tamanho={estagio === 1 ? 7 : 10} cor={cor} murcha={murcha} />
            {estagio >= 3 && (
              <>
                <Folha x={40} y={topoY + 16} lado={-1} tamanho={12} cor={cor} murcha={murcha} />
                <Folha x={40} y={topoY + 14} lado={1} tamanho={12} cor={cor} murcha={murcha} />
              </>
            )}
            {estagio >= 5 && (
              <>
                <Folha x={40} y={topoY + 28} lado={-1} tamanho={13} cor={cor} murcha={murcha} />
                <Folha x={40} y={topoY + 26} lado={1} tamanho={13} cor={cor} murcha={murcha} />
              </>
            )}
            {estagio === 4 && <ellipse cx="40" cy={topoY - 3} rx="3.5" ry="5" fill={murcha === 2 ? "#B08A6A" : "#FF7FA0"} />}
            {estagio === 5 && <Flor x={40} y={topoY - 4} r={murcha === 2 ? 4.5 : 6} cor={murcha === 2 ? "#C9A38A" : "#FF7FA0"} />}
          </g>
        )}

        {estagio >= 6 && (
          <g>
            <path d="M37 70 L38 44 L42 44 L43 70 Z" fill="#8B5A2B" />
            <circle cx="40" cy="32" r="20" fill={cor} />
            <circle cx="27" cy="38" r="12" fill={cor} />
            <circle cx="53" cy="38" r="12" fill={cor} />
            {murcha < 2 &&
              [
                [32, 26],
                [48, 30],
                [40, 40],
                [24, 40],
                [55, 42],
              ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#E5484D" />)}
          </g>
        )}
      </g>

      {/* vaso */}
      <path d="M22 70 L58 70 L54 92 L26 92 Z" fill="#C8693B" />
      <rect x="20" y="66" width="40" height="7" rx="2.5" fill="#D9804F" />
      <ellipse cx="40" cy="68" rx="17" ry="2" fill="#5C3A1E" opacity="0.6" />
    </svg>
  );
}

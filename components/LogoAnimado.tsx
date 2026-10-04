"use client";

// Etapa 261 — o logo novo (três bolinhas ligadas formando um ✓) animado:
// - "offline": as ligações se rompem, as bolinhas se afastam e ficam
//   boiando, apagadinhas, com um sinal de "procurando" piscando.
// - "online": as bolinhas voltam pro lugar com um quique, as ligações
//   se desenham de novo, o ✓ brilha e solta faíscas.
import { useId } from "react";

export type EstadoLogo = "offline" | "online" | "parado";

const VERDE = { x: 25, y: 51, r: 8 };
const CREME = { x: 42, y: 69, r: 9.5 };
const LARANJA = { x: 74, y: 31, r: 9.5 };

const CSS = `
.vt-logo .vt-bola{transition:transform .9s cubic-bezier(.34,1.56,.64,1),filter .6s ease,opacity .6s ease;transform-box:fill-box;transform-origin:center}
.vt-logo .vt-boia{animation:vt-boiar 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.vt-logo .vt-boia.b2{animation-delay:-1.1s}.vt-logo .vt-boia.b3{animation-delay:-2.2s}
@keyframes vt-boiar{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.vt-logo .vt-liga{transition:stroke-dashoffset .8s ease .35s,opacity .4s ease}
.vt-logo.off .vt-liga{opacity:.25;stroke-dasharray:3 4;stroke-dashoffset:0;animation:vt-pisca 1.6s ease-in-out infinite;transition:none}
@keyframes vt-pisca{0%,100%{opacity:.1}50%{opacity:.35}}
.vt-logo.off .v{transform:translate(-7px,-6px)}.vt-logo.off .c{transform:translate(0,6px)}.vt-logo.off .l{transform:translate(8px,-7px)}
.vt-logo.off .vt-bola{filter:saturate(.25) brightness(.8)}
.vt-logo .vt-onda{opacity:0}
.vt-logo.off .vt-onda{animation:vt-onda 2s ease-out infinite;transform-box:fill-box;transform-origin:center}
.vt-logo.off .vt-onda.o2{animation-delay:.66s}.vt-logo.off .vt-onda.o3{animation-delay:1.33s}
@keyframes vt-onda{0%{opacity:.55;transform:scale(.35)}100%{opacity:0;transform:scale(1.35)}}
.vt-logo .vt-brilho{opacity:0}
.vt-logo.on .vt-brilho{animation:vt-brilho 1.4s ease-out .9s forwards;transform-box:fill-box;transform-origin:center}
@keyframes vt-brilho{0%{opacity:.8;transform:scale(.4)}100%{opacity:0;transform:scale(1.8)}}
.vt-logo .vt-faisca{opacity:0}
.vt-logo.on .vt-faisca{animation:vt-faisca 1.1s ease-out 1s forwards}
@keyframes vt-faisca{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.3)}}
.vt-logo.on .vt-pulo{animation:vt-pulo .5s ease-out 1.05s both;transform-box:fill-box;transform-origin:center}
@keyframes vt-pulo{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}
@media (prefers-reduced-motion: reduce){.vt-logo *{animation:none!important;transition:none!important}}
`;

export function LogoAnimado({ estado, tamanho = 120, comFundo = true }: { estado: EstadoLogo; tamanho?: number; comFundo?: boolean }) {
  const id = useId().replace(/:/g, "");
  const off = estado === "offline";
  const comprimento1 = Math.hypot(CREME.x - VERDE.x, CREME.y - VERDE.y);
  const comprimento2 = Math.hypot(LARANJA.x - CREME.x, LARANJA.y - CREME.y);
  const faiscas = [
    [0, -22], [16, -16], [22, 0], [16, 16], [0, 22], [-16, 16], [-22, 0], [-16, -16],
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      width={tamanho}
      height={tamanho}
      className={`vt-logo ${off ? "off" : estado === "online" ? "on" : ""}`}
      role="img"
      aria-label={off ? "Sem conexão" : "Conectado"}
    >
      <style>{CSS}</style>
      <defs>
        <radialGradient id={`gv${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#E6F5EA" />
          <stop offset="100%" stopColor="#9FD3B0" />
        </radialGradient>
        <radialGradient id={`gc${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FFF3D6" />
          <stop offset="100%" stopColor="#EED29A" />
        </radialGradient>
        <radialGradient id={`gl${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FFB98E" />
          <stop offset="100%" stopColor="#E9875B" />
        </radialGradient>
        <linearGradient id={`fundo${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#1F3A2B" />
          <stop offset="55%" stopColor="#16171C" />
          <stop offset="100%" stopColor="#3A251E" />
        </linearGradient>
      </defs>

      {comFundo && (
        <>
          <rect x="0" y="0" width="100" height="100" rx="24" fill={`url(#fundo${id})`} />
          {[[12, 14], [83, 12], [90, 58], [16, 86], [60, 90], [50, 10], [8, 40]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={0.7} fill="#fff" opacity={0.5}>
              <animate attributeName="opacity" values="0.15;0.7;0.15" dur={`${2.4 + (i % 3) * 0.7}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </>
      )}

      {/* ondas de "procurando sinal" (só offline) */}
      {[1, 2, 3].map((n) => (
        <circle key={n} className={`vt-onda o${n}`} cx={CREME.x + 8} cy={50} r="26" fill="none" stroke="#9A9A94" strokeWidth="1.2" />
      ))}

      {/* brilho atrás do ✓ quando volta */}
      <circle className="vt-brilho" cx="50" cy="52" r="30" fill="none" stroke="#FFE3A8" strokeWidth="3" />

      {/* ligações */}
      <line
        className="vt-liga"
        x1={VERDE.x}
        y1={VERDE.y}
        x2={CREME.x}
        y2={CREME.y}
        stroke="#DCE8C8"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={off ? undefined : comprimento1}
        strokeDashoffset={off ? undefined : 0}
        style={estado === "online" ? { animation: `vt-desenha1${id} .7s ease .45s both` } : undefined}
      />
      <line
        className="vt-liga"
        x1={CREME.x}
        y1={CREME.y}
        x2={LARANJA.x}
        y2={LARANJA.y}
        stroke="#F0C59A"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeDasharray={off ? undefined : comprimento2}
        strokeDashoffset={off ? undefined : 0}
        style={estado === "online" ? { animation: `vt-desenha2${id} .7s ease .6s both` } : undefined}
      />
      <style>{`@keyframes vt-desenha1${id}{from{stroke-dashoffset:${comprimento1}}to{stroke-dashoffset:0}}@keyframes vt-desenha2${id}{from{stroke-dashoffset:${comprimento2}}to{stroke-dashoffset:0}}`}</style>

      {/* bolinhas */}
      <g className="vt-pulo">
        <g className="vt-bola v">
          <g className={off ? "vt-boia b1" : ""}>
            <circle cx={VERDE.x} cy={VERDE.y} r={VERDE.r} fill={`url(#gv${id})`} />
          </g>
        </g>
        <g className="vt-bola c">
          <g className={off ? "vt-boia b2" : ""}>
            <circle cx={CREME.x} cy={CREME.y} r={CREME.r} fill={`url(#gc${id})`} />
          </g>
        </g>
        <g className="vt-bola l">
          <g className={off ? "vt-boia b3" : ""}>
            <circle cx={LARANJA.x} cy={LARANJA.y} r={LARANJA.r} fill={`url(#gl${id})`} />
          </g>
        </g>
      </g>

      {/* faíscas quando conecta */}
      {faiscas.map(([dx, dy], i) => (
        <circle
          key={i}
          className="vt-faisca"
          cx="50"
          cy="52"
          r="1.6"
          fill={["#9FD3B0", "#EED29A", "#E9875B"][i % 3]}
          style={{ ["--dx" as any]: `${dx}px`, ["--dy" as any]: `${dy}px` }}
        />
      ))}
    </svg>
  );
}

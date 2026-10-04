// Etapa 263 — abertura do app com o logo animado: as três bolinhas
// chegam uma a uma, as ligações se desenham formando o ✓, ele brilha,
// solta faíscas, aparece "VidaTrack" e a tela some sozinha (~2,3s).
// É HTML/CSS puro (fica pronto antes do React carregar) e aparece só
// 1 vez por sessão; quem pede "reduzir animações" no celular não vê.

const L1 = Math.hypot(42 - 25, 69 - 51).toFixed(2); // verde → creme
const L2 = Math.hypot(74 - 42, 31 - 69).toFixed(2); // creme → laranja

const ESTRELAS = [
  [12, 14, 0], [83, 12, 0.6], [90, 58, 1.2], [16, 86, 0.3], [60, 90, 0.9], [50, 8, 1.5], [6, 40, 0.4], [94, 88, 1.1], [30, 30, 0.7], [70, 70, 1.3],
];
const FAISCAS = [[0, -26], [18, -18], [26, 0], [18, 18], [0, 26], [-18, 18], [-26, 0], [-18, -18]];
const CORES = ["#9FD3B0", "#EED29A", "#E9875B"];

export const CSS_ABERTURA = `
#vt-abertura{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:radial-gradient(60% 45% at 20% 75%,rgba(31,58,43,.85),transparent 70%),radial-gradient(55% 45% at 85% 20%,rgba(58,37,30,.8),transparent 70%),#0F1013;
  transition:opacity .45s ease,transform .45s ease}
html[data-abertura="saindo"] #vt-abertura{opacity:0;transform:scale(1.04);pointer-events:none}
html[data-abertura="vista"] #vt-abertura{display:none}
#vt-abertura svg{width:min(52vw,210px);height:auto;overflow:visible}
#vt-abertura .ea{animation:vtA-estrela 2.4s ease-in-out infinite;opacity:.15}
@keyframes vtA-estrela{0%,100%{opacity:.12}50%{opacity:.75}}
#vt-abertura .b{transform-box:fill-box;transform-origin:center;transform:scale(0);animation:vtA-pop .55s cubic-bezier(.34,1.56,.64,1) forwards}
#vt-abertura .b1{animation-delay:.15s}#vt-abertura .b2{animation-delay:.32s}#vt-abertura .b3{animation-delay:.49s}
@keyframes vtA-pop{0%{transform:scale(0)}100%{transform:scale(1)}}
#vt-abertura .l1{stroke-dasharray:${L1};stroke-dashoffset:${L1};animation:vtA-traco .35s ease-out .62s forwards}
#vt-abertura .l2{stroke-dasharray:${L2};stroke-dashoffset:${L2};animation:vtA-traco .45s ease-out .82s forwards}
@keyframes vtA-traco{to{stroke-dashoffset:0}}
#vt-abertura .tudo{transform-box:fill-box;transform-origin:center;animation:vtA-pulo .5s ease-out 1.25s}
@keyframes vtA-pulo{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
#vt-abertura .anel{opacity:0;transform-box:fill-box;transform-origin:center;animation:vtA-anel 1.1s ease-out 1.25s forwards}
@keyframes vtA-anel{0%{opacity:.85;transform:scale(.45)}100%{opacity:0;transform:scale(1.9)}}
#vt-abertura .f{opacity:0;animation:vtA-faisca .9s ease-out 1.3s forwards}
@keyframes vtA-faisca{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
#vt-abertura .nome{margin-top:22px;font-family:var(--font-outfit),system-ui,sans-serif;font-weight:700;font-size:30px;letter-spacing:-.01em;color:#F2F0EA;
  opacity:0;transform:translateY(10px);animation:vtA-sobe .5s ease-out 1.05s forwards}
#vt-abertura .frase{margin-top:6px;font-family:var(--font-inter),system-ui,sans-serif;font-size:14px;color:#9A9A94;opacity:0;transform:translateY(8px);animation:vtA-sobe .5s ease-out 1.25s forwards}
#vt-abertura .nome span{background:linear-gradient(90deg,#9FD3B0,#EED29A,#E9875B);-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes vtA-sobe{to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion: reduce){#vt-abertura{display:none}}
`;

export const HTML_ABERTURA = `
<svg viewBox="0 0 100 100" aria-hidden="true">
  <defs>
    <radialGradient id="vtA-gv" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#E6F5EA"/><stop offset="100%" stop-color="#9FD3B0"/></radialGradient>
    <radialGradient id="vtA-gc" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#FFF3D6"/><stop offset="100%" stop-color="#EED29A"/></radialGradient>
    <radialGradient id="vtA-gl" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#FFB98E"/><stop offset="100%" stop-color="#E9875B"/></radialGradient>
  </defs>
  ${ESTRELAS.map(([x, y, d]) => `<circle class="ea" cx="${x - 20}" cy="${y - 20}" r=".8" fill="#fff" style="animation-delay:${d}s"/>`).join("")}
  <circle class="anel" cx="50" cy="52" r="30" fill="none" stroke="#FFE3A8" stroke-width="2.5"/>
  <g class="tudo">
    <line class="l1" x1="25" y1="51" x2="42" y2="69" stroke="#DCE8C8" stroke-width="7" stroke-linecap="round"/>
    <line class="l2" x1="42" y1="69" x2="74" y2="31" stroke="#F0C59A" stroke-width="8.5" stroke-linecap="round"/>
    <circle class="b b1" cx="25" cy="51" r="8" fill="url(#vtA-gv)"/>
    <circle class="b b2" cx="42" cy="69" r="9.5" fill="url(#vtA-gc)"/>
    <circle class="b b3" cx="74" cy="31" r="9.5" fill="url(#vtA-gl)"/>
  </g>
  ${FAISCAS.map(([dx, dy], i) => `<circle class="f" cx="50" cy="52" r="1.8" fill="${CORES[i % 3]}" style="--dx:${dx}px;--dy:${dy}px"/>`).join("")}
</svg>
<div class="nome"><span>Vida</span>Track</div>
<div class="frase">Hábitos e finanças, juntos</div>
`;

/**
 * Roda antes do React: decide se mostra a abertura e some com ela no tempo certo.
 * Não remove nada do DOM (só muda um atributo no <html>), pra não brigar com o React.
 */
export const SCRIPT_ABERTURA = `(function(){try{
var h=document.documentElement,p=location.pathname;
var pular=/^\\/(apresentacao|api|auth|privacidade)/.test(p)||sessionStorage.getItem('vt-abertura')==='1'||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
if(pular){h.setAttribute('data-abertura','vista');return;}
sessionStorage.setItem('vt-abertura','1');
setTimeout(function(){h.setAttribute('data-abertura','saindo')},2050);
setTimeout(function(){h.setAttribute('data-abertura','vista')},2550);
}catch(e){document.documentElement.setAttribute('data-abertura','vista')}})();`;

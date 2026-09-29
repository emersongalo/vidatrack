"use client";

// Etapa 221 — relatório da semana, com imagem pra compartilhar (gerada
// na hora, no aparelho — nada é salvo no servidor).
import { useState } from "react";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { resumoDaSemana, type ResumoSemana } from "@/lib/geral/semana";
import { emojiDoHumor } from "@/lib/habitos/diario";

const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function linhasDoResumo(r: ResumoSemana, mostrarGastos: boolean): [string, string, string][] {
  const linhas: [string, string, string][] = [];
  if (r.habitos.devidos > 0) {
    linhas.push(["✅", `${r.habitos.pct}%`, `dos hábitos feitos (${r.habitos.feitos} de ${r.habitos.devidos})`]);
    if (r.habitos.diasPerfeitos > 0)
      linhas.push(["⭐", String(r.habitos.diasPerfeitos), r.habitos.diasPerfeitos === 1 ? "dia perfeito" : "dias perfeitos"]);
    if (r.habitos.melhor) linhas.push(["🏆", r.habitos.melhor.nome, `${r.habitos.melhor.feitos} de ${r.habitos.melhor.devidos} dias`]);
  }
  if (r.tarefas > 0) linhas.push(["📋", String(r.tarefas), r.tarefas === 1 ? "tarefa concluída" : "tarefas concluídas"]);
  if (r.humor) linhas.push([emojiDoHumor(r.humor.media), String(r.humor.media).replace(".", ","), `humor médio (${r.humor.dias} dias)`]);
  if (mostrarGastos && r.gastos.total > 0) {
    const varia =
      r.gastos.variacaoPct === null ? "" : r.gastos.variacaoPct <= 0 ? ` · ${-r.gastos.variacaoPct}% a menos` : ` · ${r.gastos.variacaoPct}% a mais`;
    linhas.push(["💸", formatarMoeda(r.gastos.total), `em gastos${varia}`]);
  }
  return linhas;
}

async function gerarImagem(r: ResumoSemana, mostrarGastos: boolean): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1350;
  const g = c.getContext("2d");
  if (!g) return null;
  const fundo = g.createLinearGradient(0, 0, 1080, 1350);
  fundo.addColorStop(0, "#15201a");
  fundo.addColorStop(1, "#1d1a24");
  g.fillStyle = fundo;
  g.fillRect(0, 0, 1080, 1350);

  g.fillStyle = "#7FB894";
  g.font = "600 44px system-ui, sans-serif";
  g.fillText("Minha semana", 90, 160);
  g.fillStyle = "#9A9A94";
  g.font = "36px system-ui, sans-serif";
  g.fillText(`${ddmm(r.inicio)} a ${ddmm(r.fim)}`, 90, 215);

  let y = 360;
  for (const [emoji, valor, texto] of linhasDoResumo(r, mostrarGastos).slice(0, 6)) {
    g.font = "64px system-ui, sans-serif";
    g.fillText(emoji, 90, y);
    g.fillStyle = "#F5F5F0";
    g.font = "700 64px system-ui, sans-serif";
    const valorCurto = valor.length > 22 ? valor.slice(0, 21) + "…" : valor;
    g.fillText(valorCurto, 190, y);
    g.fillStyle = "#9A9A94";
    g.font = "36px system-ui, sans-serif";
    g.fillText(texto.length > 44 ? texto.slice(0, 43) + "…" : texto, 190, y + 52);
    y += 150;
  }

  g.fillStyle = "#9A9A94";
  g.font = "32px system-ui, sans-serif";
  g.fillText("VidaTrack", 90, 1260);
  return new Promise((ok) => c.toBlob((b) => ok(b), "image/png"));
}

export default function SemanaPage() {
  const { snapshot } = useSnapshotOffline();
  const [mostrarGastos, setMostrarGastos] = useState(false);
  const [previa, setPrevia] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!snapshot) return <main className="min-h-screen p-6 pagina" />;
  const r = resumoDaSemana(snapshot, hojeISO());
  const linhas = linhasDoResumo(r, true);

  async function compartilhar() {
    setAviso(null);
    const blob = await gerarImagem(r, mostrarGastos);
    if (!blob) return setAviso("Não consegui gerar a imagem.");
    const arquivo = new File([blob], "minha-semana.png", { type: "image/png" });
    const nav = navigator as any;
    if (nav.canShare?.({ files: [arquivo] })) {
      try {
        await nav.share({ files: [arquivo], title: "Minha semana" });
        return;
      } catch {
        /* cancelou: mostra a prévia */
      }
    }
    const url = URL.createObjectURL(blob);
    setPrevia(url);
    const a = document.createElement("a");
    a.href = url;
    a.download = "minha-semana.png";
    a.click();
    setAviso("Se não baixou, segure a imagem abaixo pra salvar.");
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-form">
      <Link href="/habitos/estatisticas" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Estatísticas
      </Link>
      <h1 className="text-3xl font-display font-bold mt-2">Sua semana</h1>
      <p className="text-sm text-ink-400 mb-5">
        {ddmm(r.inicio)} a {ddmm(r.fim)}
      </p>

      {linhas.length === 0 ? (
        <p className="text-sm text-ink-400 bg-base-800 border border-base-600 rounded-xl2 p-5">Nada registrado nos últimos 7 dias ainda.</p>
      ) : (
        <ul className="space-y-2">
          {linhas.map(([emoji, valor, texto]) => (
            <li key={texto} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-4">
              <span className="text-2xl">{emoji}</span>
              <span className="min-w-0">
                <span className="block font-semibold font-mono truncate">{valor}</span>
                <span className="block text-xs text-ink-400">{texto}</span>
              </span>
            </li>
          ))}
          {r.gastos.maiorCategoria && (
            <li className="text-xs text-ink-400 px-1">
              Onde mais gastou: {r.gastos.maiorCategoria.nome} ({formatarMoeda(r.gastos.maiorCategoria.valor)})
            </li>
          )}
        </ul>
      )}

      {linhas.length > 0 && (
        <div className="mt-6">
          <label className="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={mostrarGastos} onChange={(e) => setMostrarGastos(e.target.checked)} />
            Mostrar gastos na imagem
          </label>
          <button
            onClick={compartilhar}
            className="w-full flex items-center justify-center gap-2 bg-habito text-base-900 font-semibold rounded-lg py-3"
          >
            <Share2 size={18} /> Compartilhar como imagem
          </button>
          {aviso && <p className="text-xs text-ink-400 mt-2">{aviso}</p>}
          {previa && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previa} alt="Resumo da semana" className="mt-4 rounded-xl2 border border-base-600 w-full" />
          )}
        </div>
      )}
    </main>
  );
}

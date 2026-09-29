"use client";

import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { HUMORES, emojiDoHumor, relacaoHabitosHumor } from "@/lib/habitos/diario";

// Etapa 215 — histórico do diário + o que o humor tem a ver com os hábitos
function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

export default function DiarioPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();

  if (snapshot === undefined) {
    return (
      <main className="min-h-screen p-6 md:p-12 pagina animate-pulse">
        <div className="h-40 bg-base-800 border border-base-600 rounded-xl2" />
      </main>
    );
  }

  const diario = [...(snapshot?.diario ?? [])].sort((a, b) => b.data.localeCompare(a.data));
  const porData = new Map(diario.map((d) => [d.data, d]));
  const ultimos35 = Array.from({ length: 35 }, (_, i) => somarDias(hoje, i - 34));

  const media = (lista: { humor: number }[]) =>
    lista.length ? Math.round((lista.reduce((s, d) => s + d.humor, 0) / lista.length) * 10) / 10 : null;
  const mesAtual = hoje.slice(0, 7);
  const [a, m] = mesAtual.split("-").map(Number);
  const mesPassado = m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
  const mediaMes = media(diario.filter((d) => d.data.startsWith(mesAtual)));
  const mediaMesPassado = media(diario.filter((d) => d.data.startsWith(mesPassado)));

  const relacoes = snapshot
    ? relacaoHabitosHumor(
        diario,
        snapshot.habitos as any,
        snapshot.habitoCheckins.filter((c: any) => !c.usuario_id || c.usuario_id === snapshot.perfil.id)
      ).slice(0, 4)
    : [];

  const contagem = HUMORES.map((h) => ({ ...h, n: diario.filter((d) => d.humor === h.valor && d.data >= somarDias(hoje, -29)).length }));
  const maxContagem = Math.max(1, ...contagem.map((c) => c.n));

  return (
    <main className="min-h-screen p-6 md:p-12 pagina pb-16">
      <Link href="/habitos" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Hoje
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Diário</h1>
      <p className="text-ink-400 text-sm mb-6">Marque como foi seu dia na tela Hoje — aqui aparece o histórico.</p>

      {diario.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="text-3xl mb-2">🙂</p>
          <p className="font-display font-semibold mb-1">Seu diário está vazio</p>
          <p className="text-ink-400 text-sm">Na tela Hoje, toque no emoji que mostra como foi seu dia.</p>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
                <p className="text-xs text-ink-400">Humor médio no mês</p>
                <p className="text-3xl font-display font-bold">
                  {mediaMes !== null ? `${emojiDoHumor(mediaMes)} ${mediaMes.toFixed(1).replace(".", ",")}` : "—"}
                </p>
              </div>
              <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
                <p className="text-xs text-ink-400">Mês passado</p>
                <p className="text-3xl font-display font-bold text-ink-400">
                  {mediaMesPassado !== null ? `${emojiDoHumor(mediaMesPassado)} ${mediaMesPassado.toFixed(1).replace(".", ",")}` : "—"}
                </p>
              </div>
            </div>

            <p className="text-sm text-ink-400 mb-2">Últimas 5 semanas</p>
            <div className="grid grid-cols-7 gap-1.5 mb-6">
              {ultimos35.map((dia) => {
                const d = porData.get(dia);
                return (
                  <div
                    key={dia}
                    title={dia.split("-").reverse().join("/")}
                    className={`aspect-square rounded-lg flex items-center justify-center text-lg ${
                      d ? "bg-base-800 border border-base-600" : "bg-base-800/40"
                    } ${dia === hoje ? "ring-1 ring-nota" : ""}`}
                  >
                    {d ? emojiDoHumor(d.humor) : <span className="text-[10px] text-ink-400">{Number(dia.slice(8))}</span>}
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-ink-400 mb-2">Últimos 30 dias</p>
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 space-y-2 mb-6">
              {contagem.map((c) => (
                <div key={c.valor} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-center">{c.emoji}</span>
                  <div className="flex-1 h-2 bg-base-600 rounded-full overflow-hidden">
                    <div className="h-full bg-nota rounded-full" style={{ width: `${(c.n / maxContagem) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs text-ink-400">{c.n}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {relacoes.length > 0 ? (
              <>
                <p className="text-sm text-ink-400 mb-2">O que seus hábitos têm a ver com seu humor</p>
                <ul className="space-y-2 mb-6">
                  {relacoes.map((r) => (
                    <li key={r.habitoId} className="bg-nota-soft border border-nota/30 rounded-xl2 p-3 text-sm">
                      {r.diferenca > 0 ? "✨ " : "🤔 "}
                      Nos dias em que você fez <strong>{r.nome}</strong>, seu humor foi{" "}
                      <strong>{r.diferenca > 0 ? "melhor" : "pior"}</strong>: {emojiDoHumor(r.mediaFeito)}{" "}
                      {r.mediaFeito.toFixed(1).replace(".", ",")} contra {emojiDoHumor(r.mediaNaoFeito)}{" "}
                      {r.mediaNaoFeito.toFixed(1).replace(".", ",")}.
                      <span className="block text-xs text-ink-400 mt-1">
                        {r.diasFeito} dias feitos x {r.diasNaoFeito} sem fazer
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-xs text-ink-400 mb-6 bg-base-800 border border-base-600 rounded-xl2 p-3">
                Com algumas semanas de diário, aparece aqui a relação entre seus hábitos e seu humor (ex: "nos dias em que
                você treinou, seu humor foi melhor").
              </p>
            )}

            <p className="text-sm text-ink-400 mb-2">Anotações</p>
            <ul className="space-y-2">
              {diario
                .filter((d) => d.texto)
                .slice(0, 30)
                .map((d) => (
                  <li key={d.data} className="flex gap-3 bg-base-800 border border-base-600 rounded-2xl p-4">
                    <span className="text-xl">{emojiDoHumor(d.humor)}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-ink-400">
                        {new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                      </p>
                      <p className="text-sm break-words">{d.texto}</p>
                    </div>
                  </li>
                ))}
              {!diario.some((d) => d.texto) && <p className="text-xs text-ink-400">Nenhuma frase escrita ainda.</p>}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}

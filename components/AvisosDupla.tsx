"use client";

// Etapa 233 — quando o seu par faz um hábito de vocês, cutuca ou reage,
// aparece na hora (se o app estiver aberto) com animação: aviso descendo
// do topo, chuva de emoji ou o toque duplo 🙌. Com o app fechado, quem
// avisa é a notificação — ao abrir, o que ainda não foi visto aparece.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { ToqueDuplo, ChuvaEmoji } from "@/components/ToqueDuplo";
import { avisarDupla } from "@/lib/habitos/avisarDupla";
import { REACOES } from "@/lib/habitos/dupla";

type Interacao = {
  id: string;
  tipo: "feito" | "cutucar" | "reacao" | "dupla";
  emoji: string | null;
  de_nome: string | null;
  habito_nome: string | null;
  habito_id: string;
};

export function AvisosDupla() {
  const router = useRouter();
  const [fila, setFila] = useState<Interacao[]>([]);
  const [chuva, setChuva] = useState<string | null>(null);
  const [respondeu, setRespondeu] = useState(false);
  const buscando = useRef(false);
  const vistos = useRef(new Set<string>());

  const buscar = useCallback(async () => {
    if (buscando.current || typeof navigator === "undefined" || !navigator.onLine) return;
    buscando.current = true;
    try {
      const supabase = createClient();
      const { data: sessao } = await supabase.auth.getSession();
      const eu = sessao.session?.user.id;
      if (!eu) return;
      const desde = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("habito_interacoes")
        .select("id, tipo, emoji, de_nome, habito_nome, habito_id")
        .eq("para_usuario", eu)
        .is("visto_em", null)
        .gte("criado_em", desde)
        .order("criado_em", { ascending: true })
        .limit(10);
      const novas = ((data ?? []) as Interacao[]).filter((i) => !vistos.current.has(i.id));
      if (!novas.length) return;
      novas.forEach((i) => vistos.current.add(i.id));
      await supabase
        .from("habito_interacoes")
        .update({ visto_em: new Date().toISOString() })
        .in(
          "id",
          novas.map((i) => i.id)
        );
      // o par fez: a carinha e a plantinha precisam do check-in novo
      if (novas.some((i) => i.tipo === "feito" || i.tipo === "dupla")) atualizarSnapshotEmTodasAsTelas();
      setFila((f) => [...f, ...novas]);
    } catch {
      /* sem aviso dessa vez */
    } finally {
      buscando.current = false;
    }
  }, []);

  useEffect(() => {
    void buscar();
    const aoVoltar = () => document.visibilityState === "visible" && void buscar();
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("online", aoVoltar);
    const t = setInterval(() => document.visibilityState === "visible" && void buscar(), 60_000);

    // ao vivo: se os dois estão com o app aberto, aparece na hora
    let canal: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const eu = data.session?.user.id;
      if (!eu) return;
      canal = supabase
        .channel(`dupla-${eu}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "habito_interacoes", filter: `para_usuario=eq.${eu}` }, () => void buscar())
        .subscribe();
    });

    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("online", aoVoltar);
      clearInterval(t);
      if (canal) supabase.removeChannel(canal);
    };
  }, [buscar]);

  const atual = fila[0] ?? null;
  const proximo = useCallback(() => {
    setRespondeu(false);
    setFila((f) => f.slice(1));
  }, []);

  // reação recebida: chuva do emoji
  useEffect(() => {
    if (atual?.tipo === "reacao" && atual.emoji) setChuva(atual.emoji);
    if (atual && atual.tipo !== "dupla") {
      try {
        (navigator as any).vibrate?.(atual.tipo === "cutucar" ? [20, 40, 20, 40, 20] : 25);
      } catch {}
    }
  }, [atual]);

  // aviso some sozinho (menos quando a pessoa está respondendo)
  useEffect(() => {
    if (!atual || atual.tipo === "dupla" || respondeu) return;
    const t = setTimeout(proximo, 6500);
    return () => clearTimeout(t);
  }, [atual, respondeu, proximo]);

  const nome = atual?.de_nome ?? "Seu par";
  const habito = atual?.habito_nome ?? "o hábito";

  return (
    <>
      {chuva && <ChuvaEmoji emoji={chuva} aoFechar={() => setChuva(null)} />}

      {atual?.tipo === "dupla" && <ToqueDuplo habito={habito} parceiro={nome} aoFechar={proximo} />}

      {atual && atual.tipo !== "dupla" && (
        <div className="fixed top-0 left-0 right-0 z-[60] px-4 flex justify-center pointer-events-none" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
          <div key={atual.id} className="animate-descer pointer-events-auto w-full max-w-md bg-base-800 border border-base-600 rounded-3xl shadow-2xl p-4">
            <div className="flex items-center gap-3">
              <span className={`text-3xl ${atual.tipo === "cutucar" ? "animate-tremer" : atual.tipo === "feito" ? "animate-pop" : ""}`}>
                {atual.tipo === "cutucar" ? "👉" : atual.tipo === "reacao" ? atual.emoji ?? "❤️" : "💚"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold truncate">
                  {atual.tipo === "cutucar" ? `${nome} te cutucou` : atual.tipo === "reacao" ? `${nome} reagiu` : `${nome} fez ${habito}`}
                </p>
                <p className="text-sm text-ink-400 truncate">
                  {atual.tipo === "cutucar" ? `Bora ${habito}? Tá te esperando 💪` : atual.tipo === "reacao" ? `Ao seu ${habito} de hoje` : "Agora é sua vez!"}
                </p>
              </div>
              <button type="button" onClick={proximo} aria-label="Fechar" className="text-ink-400 hover:text-ink-100 px-1 text-xl">
                ×
              </button>
            </div>

            {atual.tipo === "feito" && (
              <div className="flex gap-2 mt-3">
                {REACOES.slice(0, 4).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={async () => {
                      setRespondeu(true);
                      setChuva(e);
                      await avisarDupla("reacao", atual.habito_id, { emoji: e });
                      setTimeout(proximo, 900);
                    }}
                    className="flex-1 text-2xl py-1.5 rounded-xl bg-base-700 active:scale-90 transition"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
            {atual.tipo === "cutucar" && (
              <button
                type="button"
                onClick={() => {
                  proximo();
                  router.push("/habitos");
                }}
                className="w-full mt-3 bg-habito text-base-900 rounded-xl py-2.5 text-base font-semibold"
              >
                Fazer agora
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

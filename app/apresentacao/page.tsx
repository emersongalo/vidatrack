import Link from "next/link";
import Image from "next/image";
import { entrarComoDemonstracao } from "./actions";
import { AoRolar } from "@/components/AoRolar";
import { HeroDeck } from "./HeroDeck";

export const metadata = {
  title: "VidaTrack — Hábitos e finanças, num único lugar",
  description:
    "VidaTrack é um app gratuito que junta hábitos e finanças pessoais num só lugar, sem assinatura. Entre na demonstração ao vivo, sem cadastro.",
};

// Funções locais SEM "export":
function BotaoDemonstracao({ className = "" }: { className?: string }) {
  return (
    <form action={entrarComoDemonstracao}>
      <button
        type="submit"
        className={`relative group overflow-hidden bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-semibold rounded-xl px-8 py-4 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer ${className}`}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          Entrar na demonstração agora →
        </span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </button>
    </form>
  );
}

// O único export default permitido:
export default function ApresentacaoPage() {
  return (
    <main className="bg-[#090a0f] text-neutral-100 font-body overflow-x-hidden min-h-screen relative">
      <div className="pointer-events-none absolute -top-44 left-1/2 -translate-x-1/2 w-[750px] h-[550px] bg-emerald-500/15 blur-[140px] rounded-full" />

      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090a0f]/80 border-b border-neutral-800/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Image src="/icons/icon-192.png" alt="Logo" width={30} height={30} className="rounded-lg" />
            <span className="font-display font-semibold text-lg text-white">VidaTrack</span>
          </div>
          <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition">
            Já tenho conta
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Gratuito &bull; Sem anúncios &bull; Modo Offline
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight mb-6">
          Hábitos e finanças,
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
            sem virar mais um app abandonado.
          </span>
        </h1>

        <p className="text-neutral-400 max-w-lg mx-auto mb-8 text-lg">
          Controle gastos por categoria, mantenha rotinas com sequências e use o timer integrado direto no navegador ou instalado no celular.
        </p>

        <div className="flex flex-col sm:flex-row gap-3.5 justify-center mb-10">
          <BotaoDemonstracao />
          <Link
            href="/login"
            className="border border-neutral-700 bg-neutral-900/60 rounded-xl px-7 py-4 hover:border-neutral-500 transition text-neutral-300"
          >
            Criar minha conta
          </Link>
        </div>

        {/* Componente HeroDeck inserido aqui */}
        <HeroDeck />
      </section>

      {/* Seção Hábitos */}
      <section id="habitos" className="border-t border-neutral-800/80 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <AoRolar>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Módulo Hábitos</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Constância visível, dia após dia</h2>
            <p className="text-neutral-400 max-w-xl mb-12 text-lg">
              Marque o que fez e acompanhe sequências, mapa anual e timer de foco no mesmo lugar.
            </p>
          </AoRolar>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              "Sequência atual e recorde em cada hábito",
              "Conquistas ao bater 7, 30, 100 ou 365 dias",
              "Hábitos negativos para parar de fumar ou gastar",
              "Timer Pomodoro integrado para foco",
            ].map((item) => (
              <div key={item} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <span className="text-emerald-400 font-bold block mb-2">＋</span>
                <span className="text-neutral-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Finanças */}
      <section id="financas" className="border-t border-neutral-800/80 py-24 bg-neutral-950/40">
        <div className="max-w-5xl mx-auto px-6">
          <AoRolar>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Módulo Finanças</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Cada real, com clareza</h2>
            <p className="text-neutral-400 max-w-xl mb-12 text-lg">
              Separação de saldo e investimentos, alertas automáticos e divisão por categorias em gráficos visuais.
            </p>
          </AoRolar>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              "Fatura de cartão com vencimento",
              "Importação de extrato OFX e CSV",
              "Gráfico de ritmo: este mês vs mês passado",
              "Divisão de despesas compartilhadas",
              "Mapa de calor de gastos por dia",
              "Avisos inteligentes de maiores gastos",
            ].map((item) => (
              <div key={item} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-2">✦</span>
                <span className="text-neutral-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-neutral-800/80 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold mb-8 text-center">Perguntas frequentes</h2>
          <div className="space-y-3">
            {[
              {
                p: "O VidaTrack é pago?",
                r: "Não. Gratuito para sempre, sem anúncios e sem planos escondidos.",
              },
              {
                p: "Funciona offline?",
                r: "Sim. Hábitos, tarefas e lançamentos funcionam sem sinal de internet e sincronizam quando você reconectar.",
              },
              {
                p: "Preciso instalar?",
                r: "Não é obrigatório, você pode usar direto no navegador ou instalar pelo Safari/Chrome como PWA.",
              },
            ].map((faq) => (
              <details key={faq.p} className="group bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
                <summary className="font-medium cursor-pointer flex justify-between items-center text-neutral-200">
                  {faq.p}
                  <span className="text-neutral-500 group-open:rotate-45 transition">＋</span>
                </summary>
                <p className="text-neutral-400 text-sm mt-3 pt-3 border-t border-neutral-800">{faq.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
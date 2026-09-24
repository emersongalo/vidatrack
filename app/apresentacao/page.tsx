import Link from "next/link";
import Image from "next/image";
import { entrarComoDemonstracao } from "./actions";
import { AoRolar } from "@/components/AoRolar";

export const metadata = {
  title: "VidaTrack — Hábitos e finanças, num único lugar",
  description:
    "VidaTrack é um app gratuito que junta hábitos e finanças pessoais num só lugar, sem assinatura. Entre na demonstração ao vivo, sem cadastro.",
};

function BotaoDemonstracao({ className = "" }: { className?: string }) {
  return (
    <form action={entrarComoDemonstracao}>
      <button
        type="submit"
        className={`relative group overflow-hidden bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-semibold rounded-xl px-8 py-4 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer ${className}`}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          Entrar na demonstração agora
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
        <div className="absolute inset-0 bg-white/25 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
      </button>
    </form>
  );
}

// Componente de Mockup de Smartphone com sombra suave e borda estilo titânio
function MockupCelular({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="group relative mx-auto w-full max-w-[280px] sm:max-w-[310px] rounded-[44px] p-2.5 bg-gradient-to-b from-neutral-700/60 via-neutral-800/40 to-neutral-900 border border-neutral-700/50 shadow-2xl shadow-black/80 backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:shadow-emerald-500/10">
      {/* Notch / Dynamic Island */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-20 flex items-center justify-end px-2">
        <div className="w-2.5 h-2.5 rounded-full bg-neutral-900/80 border border-neutral-800" />
      </div>

      {/* Tela do Celular */}
      <div className="relative rounded-[36px] overflow-hidden bg-[#0c0d0f] aspect-[9/19.5] border border-neutral-800">
        <Image
          src={src}
          alt={alt}
          width={968}
          height={2100}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[36px] pointer-events-none" />
      </div>
    </div>
  );
}

export default function ApresentacaoPage() {
  return (
    <main className="min-h-screen bg-[#090a0f] text-neutral-100 font-body selection:bg-emerald-500/25 selection:text-emerald-200 overflow-x-hidden relative">
      
      {/* Luzes de Fundo (Glow / Radial Gradients) */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-[40%] -left-40 w-[500px] h-[500px] bg-emerald-600/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-[65%] -right-40 w-[500px] h-[500px] bg-amber-500/10 blur-[130px] rounded-full" />

      {/* Cabeçalho */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090a0f]/80 border-b border-neutral-800/80">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 ring-1 ring-white/10">
              <Image src="/icons/icon-192.png" alt="Logo VidaTrack" fill className="object-cover" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              VidaTrack
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-300 hover:text-white px-4 py-2 rounded-lg hover:bg-neutral-800/60 transition"
            >
              Já tenho conta
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline-flex text-xs uppercase tracking-wider font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 rounded-lg border border-neutral-700 transition"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        <AoRolar>
          {/* Tag de destaque */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            100% Gratuito &bull; Sem anúncios &bull; Funciona Offline
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            Hábitos e finanças,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              sem complicação.
            </span>
          </h1>

          <p className="text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed text-base sm:text-lg">
            Acompanhe suas metas diárias com timer e sequência, enquanto visualiza cada centavo em gráficos automáticos de despesas e categorias.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <BotaoDemonstracao />
            <Link
              href="/login"
              className="w-full sm:w-auto text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-500 bg-neutral-900/60 backdrop-blur-sm rounded-xl px-7 py-4 font-medium transition duration-200"
            >
              Criar conta gratuita
            </Link>
          </div>
        </AoRolar>
      </section>

      {/* MÓDULO HÁBITOS */}
      <section id="habitos" className="border-t border-neutral-800/80 bg-neutral-900/20 py-24 relative">
        <div className="max-w-5xl mx-auto px-6">
          <AoRolar>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Módulo Hábitos & Foco
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              Constância que dá gosto de ver.
            </h2>
            <p className="text-neutral-400 max-w-xl text-base sm:text-lg mb-16 leading-relaxed">
              Marque o que fez em um toque. O app gera o mapa de constância estilo GitHub, calcula recordes, avisa o que precisa de foco e inclui Timer Pomodoro integrado.
            </p>
          </AoRolar>

          {/* Grid de Mockups dos Hábitos */}
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <AoRolar atraso={0}>
              <div className="flex flex-col items-center">
                <MockupCelular src="/apresentacao/hoje.jpg" alt="Tela de rotina e hábitos do dia" />
                <div className="text-center mt-5">
                  <h3 className="font-semibold text-neutral-100 text-lg">Visão Diária & Hábitos</h3>
                  <p className="text-neutral-400 text-sm mt-1">
                    Marque tarefas com um clique e visualize o progresso do dia instantaneamente.
                  </p>
                </div>
              </div>
            </AoRolar>

            <AoRolar atraso={150}>
              <div className="flex flex-col items-center">
                <MockupCelular src="/apresentacao/estatisticas.jpg" alt="Estatísticas, heatmap e comparação" />
                <div className="text-center mt-5">
                  <h3 className="font-semibold text-neutral-100 text-lg">Mapa de Contribuições</h3>
                  <p className="text-neutral-400 text-sm mt-1">
                    Visual estilo GitHub para acompanhar sua consistência ao longo do ano inteiro.
                  </p>
                </div>
              </div>
            </AoRolar>

            <AoRolar atraso={300}>
              <div className="flex flex-col items-center">
                <MockupCelular src="/apresentacao/timer.jpg" alt="Timer integrado com blocos de tempo" />
                <div className="text-center mt-5">
                  <h3 className="font-semibold text-neutral-100 text-lg">Timer de Foco</h3>
                  <p className="text-neutral-400 text-sm mt-1">
                    Pomodoro de 5m a 45m integrado diretamente à sua rotina diária.
                  </p>
                </div>
              </div>
            </AoRolar>
          </div>

          {/* Destaques em Pills / Bento Cards */}
          <AoRolar atraso={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
              {[
                { titulo: "Sequência e Recorde", desc: "Acompanhe seus dias seguidos sem quebrar o ritmo." },
                { titulo: "Hábitos Negativos", desc: "Monitore dias limpos de hábitos que quer eliminar." },
                { titulo: "Blocos de Tempo", desc: "Organize tarefas e cronometre o foco sem sair do app." },
                { titulo: "Comparativo Semanal", desc: "Descubra qual hábito precisa de mais atenção agora." },
              ].map((item) => (
                <div
                  key={item.titulo}
                  className="bg-neutral-900/60 border border-neutral-800/80 p-5 rounded-2xl hover:border-emerald-500/40 transition-colors"
                >
                  <span className="text-emerald-400 font-bold text-sm">✓</span>
                  <h4 className="font-medium text-neutral-200 mt-2">{item.titulo}</h4>
                  <p className="text-neutral-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </AoRolar>
        </div>
      </section>

      {/* MÓDULO FINANÇAS */}
      <section id="financas" className="border-t border-neutral-800/80 py-24 relative">
        <div className="max-w-5xl mx-auto px-6">
          <AoRolar>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80" />
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                Módulo Finanças
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              Cada centavo sob controle, sem planilhas.
            </h2>
            <p className="text-neutral-400 max-w-xl text-base sm:text-lg mb-16 leading-relaxed">
              Separe investimentos da conta corrente, analise despesas por gráficos circulares e veja alertas automáticos sobre onde seu dinheiro está indo.
            </p>
          </AoRolar>

          {/* Grid de Mockups de Finanças */}
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <AoRolar atraso={0}>
              <div className="flex flex-col items-center">
                <MockupCelular src="/apresentacao/painel-financas.jpg" alt="Painel financeiro e saldo em contas" />
                <div className="text-center mt-5">
                  <h3 className="font-semibold text-neutral-100 text-lg">Visão Geral do Saldo</h3>
                  <p className="text-neutral-400 text-sm mt-1">
                    Separação clara entre saldo disponível em contas e valor investido.
                  </p>
                </div>
              </div>
            </AoRolar>

            <AoRolar atraso={150}>
              <div className="flex flex-col items-center">
                <MockupCelular src="/apresentacao/despesas-categoria.jpg" alt="Gráfico circular de gastos por categoria" />
                <div className="text-center mt-5">
                  <h3 className="font-semibold text-neutral-100 text-lg">Gastos por Categoria</h3>
                  <p className="text-neutral-400 text-sm mt-1">
                    Gráfico circular visual para saber exatamente onde cada real foi gasto.
                  </p>
                </div>
              </div>
            </AoRolar>

            <AoRolar atraso={300}>
              <div className="flex flex-col items-center">
                <MockupCelular src="/apresentacao/analise.jpg" alt="Gráfico de ritmo de gasto e insights" />
                <div className="text-center mt-5">
                  <h3 className="font-semibold text-neutral-100 text-lg">Ritmo & Dicas Inteligentes</h3>
                  <p className="text-neutral-400 text-sm mt-1">
                    Insights automáticos apontando o impacto das maiores despesas do mês.
                  </p>
                </div>
              </div>
            </AoRolar>
          </div>

          {/* Lista de Recursos Avançados */}
          <AoRolar atraso={150}>
            <div className="mt-16 p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800">
              <h4 className="text-center font-display font-semibold text-lg text-neutral-200 mb-6">
                Tudo o que você precisa no bolso
              </h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {[
                  "Extrato detalhado por conta bancária",
                  "Ritmo de gasto: este mês vs mês passado",
                  "Mapa de calor de gastos por dia do mês",
                  "Metas de investimento separadas",
                  "Suporte offline com sincronização automática",
                  "Sem propagandas ou assinaturas",
                ].map((beneficio) => (
                  <div key={beneficio} className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-800/40 border border-neutral-700/50">
                    <span className="text-amber-400 text-base">✦</span>
                    <span className="text-neutral-300 text-xs sm:text-sm">{beneficio}</span>
                  </div>
                ))}
              </div>
            </div>
          </AoRolar>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-neutral-800/80 py-20 bg-neutral-950">
        <div className="max-w-2xl mx-auto px-6">
          <AoRolar>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-10 text-center">
              Perguntas frequentes
            </h2>
            <div className="space-y-3">
              {[
                {
                  pergunta: "O VidaTrack é realmente gratuito?",
                  resposta:
                    "Sim, e sempre será. O projeto não possui assinaturas ocultas, paywalls ou anúncios intrusivos.",
                },
                {
                  pergunta: "Funciona sem sinal de internet?",
                  resposta:
                    "Sim! Você pode marcar hábitos, rodar o timer e registrar lançamentos mesmo offline. Assim que restabelecer a conexão, tudo sincroniza com seu perfil.",
                },
                {
                  pergunta: "O que acontece na demonstração?",
                  resposta:
                    "Você acessa imediatamente uma conta preenchida com dados reais de exemplo para testar as telas, gráficos e funcionalidades antes de se cadastrar.",
                },
              ].map((item) => (
                <details
                  key={item.pergunta}
                  className="group bg-neutral-900/60 border border-neutral-800 rounded-2xl px-6 py-4.5 transition-colors hover:border-neutral-700"
                >
                  <summary className="flex items-center justify-between cursor-pointer font-medium list-none text-neutral-200">
                    {item.pergunta}
                    <span className="text-neutral-500 group-open:rotate-45 transition-transform duration-200 text-lg">
                      ＋
                    </span>
                  </summary>
                  <p className="text-neutral-400 text-sm leading-relaxed mt-3 pt-3 border-t border-neutral-800/60">
                    {item.resposta}
                  </p>
                </details>
              ))}
            </div>
          </AoRolar>
        </div>
      </section>

      {/* CTA Final */}
      <section className="border-t border-neutral-800/80 py-24 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="relative max-w-xl mx-auto px-6">
          <AoRolar>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Experimente em 5 segundos
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg mb-8">
              Não precisa de e-mail, cartão ou senha para testar. Clique e navegue pela demonstração.
            </p>
            <BotaoDemonstracao className="w-full sm:w-auto" />
          </AoRolar>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-10 text-neutral-500 text-xs">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© VidaTrack — Hábitos e Finanças em Harmonia.</p>
          <div className="flex gap-4">
            <Link href="/privacidade" className="hover:text-neutral-300 transition">Privacidade</Link>
            <Link href="/login" className="hover:text-neutral-300 transition">Entrar</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
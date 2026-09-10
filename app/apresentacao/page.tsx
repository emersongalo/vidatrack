import Link from "next/link";
import Image from "next/image";
import { entrarComoDemonstracao } from "./actions";

export const metadata = {
  title: "VidaTrack — Hábitos e finanças, num único lugar",
  description:
    "VidaTrack é um app gratuito que junta hábitos e finanças pessoais num só lugar, sem assinatura. Teste a demonstração ao vivo.",
};

export default function ApresentacaoPage() {
  return (
    <main className="bg-base-900 text-ink-100 font-body">
      {/* Cabeçalho */}
      <header className="max-w-3xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-lg" />
          <span className="font-display font-semibold">VidaTrack</span>
        </div>
        <Link href="/login" className="text-sm text-ink-400 hover:text-ink-100 transition">
          Entrar
        </Link>
      </header>

      {/* Hero — o trilho ampliado é o próprio ícone do app, virado protagonista */}
      <section className="max-w-3xl mx-auto px-6 pt-10 pb-20 text-center">
        <div className="relative w-[3px] h-40 mx-auto mb-10 overflow-hidden rounded-full bg-base-700">
          <div className="absolute inset-0 trilho-linha origin-top animate-[crescer_1.4s_ease-out_forwards]" />
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight mb-5">
          Hábitos e finanças,
          <br />
          sem virar mais um app
          <br />
          que você abandona.
        </h1>
        <p className="text-ink-400 max-w-md mx-auto mb-10 leading-relaxed">
          VidaTrack junta as duas coisas onde elas já se encontram na sua
          rotina. Sem assinatura, sem anúncio, sem letra miúda.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="#demonstracao"
            className="bg-ink-100 text-base-900 font-medium rounded-lg px-6 py-3 hover:opacity-90 transition"
          >
            Testar agora, sem cadastro
          </Link>
          <Link
            href="/login"
            className="border border-base-600 rounded-lg px-6 py-3 hover:border-ink-400 transition"
          >
            Criar conta grátis
          </Link>
        </div>
      </section>

      {/* Hábitos */}
      <section className="border-t border-base-700">
        <div className="max-w-3xl mx-auto px-6 py-16 grid sm:grid-cols-[auto_1fr] gap-x-6 gap-y-8">
          <div className="hidden sm:flex flex-col items-center">
            <span className="w-3 h-3 rounded-full bg-habito shrink-0" />
            <span className="w-[2px] flex-1 bg-base-700 mt-3" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold mb-3">
              Constância visível, dia após dia
            </h2>
            <p className="text-ink-400 leading-relaxed mb-6 max-w-md">
              Marque o que fez, acompanhe sua sequência, e veja um ano
              inteiro de constância num só olhar — igual quem programa já
              está acostumado a ver no próprio trabalho.
            </p>
            <ul className="space-y-2.5 text-sm mb-8">
              <li className="flex gap-2.5">
                <span className="text-habito shrink-0">＋</span>
                Sequência atual e recorde em cada hábito
              </li>
              <li className="flex gap-2.5">
                <span className="text-habito shrink-0">＋</span>
                Mapa do ano inteiro, tipo o de contribuições do GitHub
              </li>
              <li className="flex gap-2.5">
                <span className="text-habito shrink-0">＋</span>
                Hábitos negativos, pra quem quer parar de fazer algo
              </li>
              <li className="flex gap-2.5">
                <span className="text-habito shrink-0">＋</span>
                Tarefas, categorias e timer de foco, no mesmo lugar
              </li>
            </ul>
            <div className="rounded-xl2 overflow-hidden border border-base-700 max-w-xs">
              <Image
                src="/apresentacao/print-painel.png"
                alt="Tela inicial do VidaTrack mostrando os módulos de Hábitos e Finanças"
                width={528}
                height={1312}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Finanças */}
      <section className="border-t border-base-700">
        <div className="max-w-3xl mx-auto px-6 py-16 grid sm:grid-cols-[auto_1fr] gap-x-6 gap-y-8">
          <div className="hidden sm:flex flex-col items-center">
            <span className="w-3 h-3 rounded-full bg-financa shrink-0" />
            <span className="w-[2px] flex-1 bg-base-700 mt-3" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold mb-3">
              Cada real, com clareza
            </h2>
            <p className="text-ink-400 leading-relaxed mb-6 max-w-md">
              Lance receitas e despesas, separe o que é investimento do
              que é saldo do dia a dia, e deixe o app apontar sozinho
              onde o dinheiro está indo.
            </p>
            <ul className="space-y-2.5 text-sm mb-8">
              <li className="flex gap-2.5">
                <span className="text-financa shrink-0">＋</span>
                Dicas automáticas sobre seus próprios gastos
              </li>
              <li className="flex gap-2.5">
                <span className="text-financa shrink-0">＋</span>
                Fatura de cartão de crédito de verdade, com vencimento
              </li>
              <li className="flex gap-2.5">
                <span className="text-financa shrink-0">＋</span>
                Metas de economia e aviso de orçamento estourado
              </li>
              <li className="flex gap-2.5">
                <span className="text-financa shrink-0">＋</span>
                Divide despesa com outra pessoa, sem planilha
              </li>
              <li className="flex gap-2.5">
                <span className="text-financa shrink-0">＋</span>
                Importa extrato do banco (OFX ou CSV) em vez de digitar
              </li>
            </ul>
            <div className="rounded-xl2 overflow-hidden border border-base-700 max-w-xs">
              <Image
                src="/apresentacao/print-analise.png"
                alt="Tela de análise de gastos do VidaTrack, com dicas automáticas"
                width={528}
                height={1312}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Demonstração */}
      <section id="demonstracao" className="border-t border-base-700 scroll-mt-6">
        <div className="max-w-3xl mx-auto px-6 py-16 grid sm:grid-cols-[auto_1fr] gap-x-6">
          <div className="hidden sm:flex flex-col items-center">
            <span className="w-3 h-3 rounded-full bg-ink-100 shrink-0" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold mb-3">
              Entra e mexe, sem criar nada
            </h2>
            <p className="text-ink-400 leading-relaxed mb-6 max-w-md">
              Essa conta já vem com hábitos e lançamentos de exemplo. Os
              dados são compartilhados por quem estiver testando, e voltam
              ao normal de tempos em tempos — não é o lugar pra guardar
              nada de verdade.
            </p>
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 max-w-sm mb-6">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs text-ink-400">E-mail</span>
                <span className="font-mono text-sm">demo@vidatrack.online</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-ink-400">Senha</span>
                <span className="font-mono text-sm">VidaTrack2026</span>
              </div>
            </div>
            <form action={entrarComoDemonstracao}>
              <button
                type="submit"
                className="inline-block bg-ink-100 text-base-900 font-medium rounded-lg px-6 py-3 hover:opacity-90 transition"
              >
                Entrar na demonstração agora
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-base-700">
        <div className="max-w-3xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-400">
          <span>VidaTrack — gratuito, sem anúncio.</span>
          <div className="flex gap-5">
            <Link href="/privacidade" className="hover:text-ink-100 transition">
              Privacidade
            </Link>
            <Link href="/doacao" className="hover:text-ink-100 transition">
              Apoiar o projeto
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

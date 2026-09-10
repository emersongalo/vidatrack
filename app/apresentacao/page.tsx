import Link from "next/link";
import Image from "next/image";
import { entrarComoDemonstracao } from "./actions";

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
        className={`bg-ink-100 text-base-900 font-medium rounded-lg px-7 py-3.5 hover:opacity-90 transition ${className}`}
      >
        Entrar na demonstração agora →
      </button>
    </form>
  );
}

function Print({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-xl2 overflow-hidden border border-base-700 shadow-2xl shadow-black/40">
      <Image src={src} alt={alt} width={968} height={2376} className="w-full h-auto" />
    </div>
  );
}

export default function ApresentacaoPage() {
  return (
    <main className="bg-base-900 text-ink-100 font-body overflow-x-hidden">
      {/* Cabeçalho */}
      <header className="max-w-5xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-lg" />
          <span className="font-display font-semibold">VidaTrack</span>
        </div>
        <Link href="/login" className="text-sm text-ink-400 hover:text-ink-100 transition">
          Já tenho conta
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-6 pb-24 text-center">
        <div className="relative w-[3px] h-40 mx-auto mb-10 overflow-hidden rounded-full bg-base-700">
          <div className="absolute inset-0 trilho-linha origin-top animate-[crescer_1.4s_ease-out_forwards]" />
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-[1.05] mb-6">
          Hábitos e finanças,
          <br />
          sem virar mais um app
          <br />
          que você abandona.
        </h1>
        <p className="text-ink-400 max-w-md mx-auto mb-10 leading-relaxed text-lg">
          Gratuito. Sem anúncio. Sem assinatura. Entra agora e mexe
          numa conta de exemplo, sem criar nada.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <BotaoDemonstracao />
          <Link
            href="/login"
            className="border border-base-600 rounded-lg px-7 py-3.5 hover:border-ink-400 transition"
          >
            Criar minha conta
          </Link>
        </div>
      </section>

      {/* HÁBITOS — visão geral */}
      <section className="border-t border-base-700">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-habito shrink-0" />
            <span className="text-xs uppercase tracking-widest text-habito font-medium">Módulo Hábitos</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4 max-w-lg">
            Constância visível, dia após dia
          </h2>
          <p className="text-ink-400 leading-relaxed max-w-lg mb-14 text-lg">
            Marca o que fez, e o app cuida do resto: sequência, recorde,
            comparação entre hábitos e um mapa do ano inteiro — sem
            precisar calcular nada na cabeça.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Print src="/apresentacao/hoje.jpg" alt="Tela Hoje com hábitos e tarefas do dia" />
              <p className="font-medium mt-4 mb-1">Tudo num lugar só</p>
              <p className="text-sm text-ink-400">
                Hábitos e tarefas do dia, lado a lado. Marca com um toque.
              </p>
            </div>
            <div>
              <Print src="/apresentacao/estatisticas.jpg" alt="Resumo semanal e mapa de contribuições" />
              <p className="font-medium mt-4 mb-1">Mapa do ano inteiro</p>
              <p className="text-sm text-ink-400">
                Igual o de contribuições do GitHub — só que da sua constância.
              </p>
            </div>
            <div>
              <Print src="/apresentacao/comparacao.jpg" alt="Comparação entre hábitos" />
              <p className="font-medium mt-4 mb-1">Comparação entre hábitos</p>
              <p className="text-sm text-ink-400">
                Vê de cara qual hábito está indo bem, e qual precisa de atenção.
              </p>
            </div>
          </div>

          <ul className="grid sm:grid-cols-2 gap-3 mt-12 text-sm">
            {[
              "Sequência atual e recorde em cada hábito",
              "Conquistas ao bater 7, 30, 100 ou 365 dias",
              "Hábitos negativos, pra quem quer parar de fazer algo",
              "Tarefas, categorias e timer de foco, no mesmo lugar",
            ].map((texto) => (
              <li key={texto} className="flex gap-2.5 bg-base-800 border border-base-700 rounded-lg px-4 py-3">
                <span className="text-habito shrink-0">＋</span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FINANÇAS — visão geral */}
      <section className="border-t border-base-700">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-financa shrink-0" />
            <span className="text-xs uppercase tracking-widest text-financa font-medium">Módulo Finanças</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4 max-w-lg">
            Cada real, com clareza
          </h2>
          <p className="text-ink-400 leading-relaxed max-w-lg mb-14 text-lg">
            Lança receitas e despesas, separa investimento do saldo do
            dia a dia, e deixa o app apontar sozinho onde o dinheiro
            está indo.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Print src="/apresentacao/painel-financas.jpg" alt="Saldo em contas e investido" />
              <p className="font-medium mt-4 mb-1">Saldo, num golpe de vista</p>
              <p className="text-sm text-ink-400">
                Contas e investido separados — sabe sempre quanto pode gastar.
              </p>
            </div>
            <div>
              <Print src="/apresentacao/analise.jpg" alt="Dicas automáticas sobre os gastos" />
              <p className="font-medium mt-4 mb-1">Dicas automáticas</p>
              <p className="text-sm text-ink-400">
                O app aponta sozinho onde seu dinheiro está concentrado.
              </p>
            </div>
            <div>
              <Print src="/apresentacao/despesas-categoria.jpg" alt="Despesas por categoria" />
              <p className="font-medium mt-4 mb-1">Gastos por categoria</p>
              <p className="text-sm text-ink-400">
                Alimentação, moradia, lazer — visual, sem planilha nenhuma.
              </p>
            </div>
          </div>

          <div className="mt-14">
            <Print src="/apresentacao/recursos.jpg" alt="Recursos avançados de Finanças" />
          </div>

          <ul className="grid sm:grid-cols-2 gap-3 mt-8 text-sm">
            {[
              "Fatura de cartão de crédito de verdade, com vencimento",
              "Metas de economia e aviso de orçamento estourado",
              "Divide despesa com outra pessoa, sem planilha",
              "Importa extrato do banco (OFX ou CSV)",
              "Patrimônio líquido, mês a mês",
              "Conta compartilhada com quem você quiser",
            ].map((texto) => (
              <li key={texto} className="flex gap-2.5 bg-base-800 border border-base-700 rounded-lg px-4 py-3">
                <span className="text-financa shrink-0">＋</span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-base-700">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl font-semibold mb-4">
            Só entrar e mexer
          </h2>
          <p className="text-ink-400 leading-relaxed mb-10 max-w-md mx-auto">
            A demonstração já vem com hábitos e lançamentos de exemplo.
            Não precisa criar nada, não precisa digitar senha — clica e
            já está dentro.
          </p>
          <BotaoDemonstracao />
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-base-700">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-400">
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

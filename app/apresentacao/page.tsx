import Link from "next/link";
import Image from "next/image";
import { entrarComoDemonstracao } from "./actions";
import { AoRolar } from "@/components/AoRolar";
import { DemoJuntos } from "@/components/DemoJuntos";

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
      <Image src={src} alt={alt} width={968} height={2155} className="w-full h-auto" />
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
      <section className="max-w-5xl mx-auto px-6 pt-6 pb-8 text-center">
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

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <BotaoDemonstracao />
          <Link
            href="/login"
            className="border border-base-600 rounded-lg px-7 py-3.5 hover:border-ink-400 transition"
          >
            Criar minha conta
          </Link>
        </div>
      </section>

      {/* Celular na frente com outras telas espiando atrás.
         Prints atualizados com o layout novo (Início, Finanças e Hábitos). */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="relative flex items-center justify-center py-6">
          <div className="hidden sm:block absolute left-1/2 -translate-x-[190px] -rotate-6 w-[220px] opacity-60 blur-[0.5px]">
            <Print src="/apresentacao/financas.jpg" alt="Resumo de Finanças com saldo e previsão do mês" />
          </div>
          <div className="hidden sm:block absolute left-1/2 translate-x-[30px] rotate-6 w-[220px] opacity-60 blur-[0.5px]">
            <Print src="/apresentacao/habitos.jpg" alt="Lista de hábitos com sequência e recorde" />
          </div>
          <div className="relative w-[260px] sm:w-[280px] z-10">
            <Print src="/apresentacao/inicio.jpg" alt="Tela inicial do VidaTrack" />
          </div>
        </div>
      </section>

      {/* HÁBITOS — visão geral */}
      <section id="hábitos" className="border-t border-base-700">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <AoRolar>
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
          </AoRolar>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AoRolar>
            <div>
              <Print src="/apresentacao/hoje.jpg" alt="Tela Hoje com hábitos separados por período" />
              <p className="font-medium mt-4 mb-1">Seu dia numa tela só</p>
              <p className="text-sm text-ink-400">
                Hábitos e tarefas separados por período, com lembrete e progresso do dia.
              </p>
            </div>
            </AoRolar>
            <AoRolar atraso={150}>
            <div>
              <Print src="/apresentacao/habitos.jpg" alt="Lista de hábitos com sequência atual e recorde" />
              <p className="font-medium mt-4 mb-1">Sequência e recorde</p>
              <p className="text-sm text-ink-400">
                Cada hábito mostra a sequência atual, o recorde e os últimos 7 dias.
              </p>
            </div>
            </AoRolar>
            <AoRolar atraso={300}>
            <div>
              <Print src="/apresentacao/timer.jpg" alt="Timer de foco com Pomodoro e tempo livre" />
              <p className="font-medium mt-4 mb-1">Timer de foco</p>
              <p className="text-sm text-ink-400">
                Pomodoro ou tempo livre, ligado a um hábito se você quiser.
              </p>
            </div>
            </AoRolar>
          </div>

          <AoRolar>
          <ul className="grid sm:grid-cols-2 gap-3 mt-12 text-sm">
            {[
              "Sequência atual e recorde em cada hábito",
              "Conquistas ao bater 7, 30, 100 ou 365 dias",
              "Hábitos negativos, pra quem quer parar de fazer algo",
              "Modo férias: pausa tudo sem perder as sequências",
              "Mapa do ano inteiro e comparação entre hábitos",
              "Arraste pro lado pra marcar, com vibração e comemoração do dia",
            ].map((texto) => (
              <li key={texto} className="flex gap-2.5 bg-base-800 border border-base-700 rounded-lg px-4 py-3">
                <span className="text-habito shrink-0">＋</span>
                {texto}
              </li>
            ))}
          </ul>
          </AoRolar>
        </div>
      </section>

      {/* JUNTOS — hábitos em dupla (Etapa 239) */}
      <section id="juntos" className="border-t border-base-700">
        <div className="max-w-5xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <AoRolar>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-habito shrink-0" />
              <span className="text-xs uppercase tracking-widest text-habito font-medium">Hábitos em dupla</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4 max-w-lg">
              Façam juntos. Vejam crescer.
            </h2>
            <p className="text-ink-400 leading-relaxed max-w-lg mb-8 text-lg">
              Compartilhe um hábito com quem você ama. Cada dia que os dois fazem, a plantinha de vocês cresce — de
              semente até árvore. Se ninguém fizer, ela murcha um pouco (e volta quando vocês retomam).
            </p>
            <ul className="space-y-3 text-base">
              {[
                ["💚", "Aviso na hora quando seu par faz o hábito"],
                ["😄", "Uma carinha que muda: festa, esperando, preocupada, triste"],
                ["👉", "Cutucar quem ainda não fez e reagir com ❤️🔥👏"],
                ["🙌", "Toque duplo quando os dois completam no mesmo dia"],
                ["🌙", "O céu acompanha a hora: amanhecer, dia, fim de tarde e noite estrelada"],
              ].map(([emoji, texto]) => (
                <li key={texto} className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">{emoji}</span>
                  <span className="text-ink-400">{texto}</span>
                </li>
              ))}
            </ul>
          </AoRolar>
          <AoRolar atraso={150}>
            <DemoJuntos />
            <p className="text-center text-sm text-ink-400 mt-3">Isso aqui é ao vivo — o céu é o da sua hora agora.</p>
          </AoRolar>
        </div>
      </section>

      {/* FINANÇAS — visão geral */}
      <section id="finanças" className="border-t border-base-700">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <AoRolar>
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
          </AoRolar>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AoRolar>
            <div>
              <Print src="/apresentacao/financas.jpg" alt="Previsão de quanto vai sobrar no fim do mês" />
              <p className="font-medium mt-4 mb-1">Quanto vai sobrar no mês</p>
              <p className="text-sm text-ink-400">
                O app soma o que ainda vai entrar e sair e mostra quanto dá pra gastar por dia.
              </p>
            </div>
            </AoRolar>
            <AoRolar atraso={150}>
            <div>
              <Print src="/apresentacao/analise.jpg" alt="Para onde vai seu dinheiro, com dicas automáticas" />
              <p className="font-medium mt-4 mb-1">Dicas automáticas</p>
              <p className="text-sm text-ink-400">
                O app aponta sozinho onde seu dinheiro está concentrado.
              </p>
            </div>
            </AoRolar>
            <AoRolar atraso={300}>
            <div>
              <Print src="/apresentacao/graficos.jpg" alt="Gastos por categoria e ritmo de gasto comparados ao mês passado" />
              <p className="font-medium mt-4 mb-1">Este mês x mês passado</p>
              <p className="text-sm text-ink-400">
                Gastos por categoria e ritmo do mês, lado a lado com o mês anterior.
              </p>
            </div>
            </AoRolar>
          </div>

          <AoRolar>
          <div className="grid sm:grid-cols-2 gap-6 mt-14 max-w-2xl mx-auto">
            <div>
              <Print src="/apresentacao/contas.jpg" alt="Contas com saldo e total investido" />
              <p className="font-medium mt-4 mb-1">Contas e investimentos</p>
              <p className="text-sm text-ink-400">
                Saldo de cada conta, com o investido separado do dinheiro do dia a dia.
              </p>
            </div>
            <div>
              <Print src="/apresentacao/mapa-calor.jpg" alt="Mapa de calor de gastos por dia e ranking de categorias" />
              <p className="font-medium mt-4 mb-1">Mapa de calor dos gastos</p>
              <p className="text-sm text-ink-400">
                Os dias em que você mais gastou saltam aos olhos, junto com o ranking do mês.
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-ink-400 mt-10">
            E ainda mais: metas de economia, importar extrato, dividir despesas, patrimônio líquido...
          </p>

          <ul className="grid sm:grid-cols-2 gap-3 mt-8 text-sm">
            {[
              "Fatura de cartão de verdade, com aviso no dia de pagar",
              "Gráfico do que saiu e do que entrou, lado a lado",
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
          </AoRolar>
        </div>
      </section>

      {/* Tema claro ou escuro */}
      <section className="border-t border-base-700">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <AoRolar>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4 text-center">
            Claro ou escuro, do seu jeito
          </h2>
          <p className="text-ink-400 leading-relaxed max-w-md mx-auto mb-14 text-lg text-center">
            Troca o tema com um toque. E o Início é montado por você: só hábitos, só finanças ou os dois.
          </p>
          </AoRolar>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-xl mx-auto">
            <AoRolar>
              <Print src="/apresentacao/inicio-claro.jpg" alt="Tela inicial no tema claro" />
            </AoRolar>
            <AoRolar atraso={150}>
              <Print src="/apresentacao/inicio.jpg" alt="Tela inicial no tema escuro" />
            </AoRolar>
          </div>
        </div>
      </section>

      {/* Perguntas Frequentes */}
      <section id="faq" className="border-t border-base-700">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <AoRolar>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-10 text-center">
              Perguntas frequentes
            </h2>
            <div className="space-y-3">
              {[
                {
                  pergunta: "O VidaTrack é pago?",
                  resposta:
                    "Não, e não vai ser. Gratuito pra sempre, sem anúncio, sem versão \"premium\" escondendo recurso.",
                },
                {
                  pergunta: "Funciona sem internet?",
                  resposta:
                    "Sim. Hábitos, tarefas, contas, lançamentos — tudo continua funcionando offline, e sincroniza sozinho quando a conexão voltar.",
                },
                {
                  pergunta: "Meus dados são seguros?",
                  resposta:
                    "Ficam guardados de forma privada, e só você (ou quem você decidir compartilhar) tem acesso. Nada é vendido ou usado pra anúncio.",
                },
                {
                  pergunta: "Preciso instalar alguma coisa?",
                  resposta:
                    "Não é obrigatório — funciona direto no navegador. Mas dá pra instalar como app (Android tem o APK; iPhone instala como PWA, pelo Safari) pra abrir mais rápido e receber notificação.",
                },
                {
                  pergunta: "Dá pra usar com outra pessoa?",
                  resposta:
                    "Sim. Você compartilha contas e hábitos com quem quiser — cada um entra com a própria conta. Nos hábitos em dupla, vocês recebem aviso quando o outro faz, se cutucam e cuidam juntos de uma plantinha.",
                },
              ].map((item) => (
                <details key={item.pergunta} className="group bg-base-800 border border-base-700 rounded-xl2 px-5 py-4">
                  <summary className="flex items-center justify-between cursor-pointer font-medium list-none">
                    {item.pergunta}
                    <span className="text-ink-400 shrink-0 ml-3 transition group-open:rotate-45">＋</span>
                  </summary>
                  <p className="text-ink-400 text-sm leading-relaxed mt-3">{item.resposta}</p>
                </details>
              ))}
            </div>
          </AoRolar>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-base-700">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <AoRolar>
          <h2 className="font-display text-3xl font-semibold mb-4">
            Só entrar e mexer
          </h2>
          <p className="text-ink-400 leading-relaxed mb-10 max-w-md mx-auto">
            A demonstração já vem com hábitos e lançamentos de exemplo.
            Não precisa criar nada, não precisa digitar senha — clica e
            já está dentro.
          </p>
          <BotaoDemonstracao />
          </AoRolar>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-base-700">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-wrap gap-8 mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-400/70 mb-3">Produto</p>
              <div className="flex flex-col gap-2 text-sm text-ink-400">
                <Link href="#hábitos" className="hover:text-ink-100 transition">Hábitos</Link>
                <Link href="#juntos" className="hover:text-ink-100 transition">Juntos</Link>
                <Link href="#finanças" className="hover:text-ink-100 transition">Finanças</Link>
                <Link href="#faq" className="hover:text-ink-100 transition">Perguntas frequentes</Link>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-400/70 mb-3">Conta</p>
              <div className="flex flex-col gap-2 text-sm text-ink-400">
                <Link href="/login" className="hover:text-ink-100 transition">Entrar</Link>
                <Link href="/login" className="hover:text-ink-100 transition">Criar conta</Link>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-400/70 mb-3">Legal</p>
              <div className="flex flex-col gap-2 text-sm text-ink-400">
                <Link href="/privacidade" className="hover:text-ink-100 transition">Privacidade</Link>
                <Link href="/doacao" className="hover:text-ink-100 transition">Apoiar o projeto</Link>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-ink-400 pt-6 border-t border-base-700">
            <span>VidaTrack — gratuito, sem anúncio.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

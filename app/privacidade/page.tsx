import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Painel
      </Link>

      <h1 className="text-2xl font-display font-semibold mt-4 mb-2">Privacidade no VidaTrack</h1>
      <p className="text-ink-400 text-sm mb-8">
        Sem juridiquês. Isto é o que fazemos e o que não fazemos com os seus dados.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="font-display font-semibold text-lg mb-2 text-habito">
            Outras pessoas não veem seus dados
          </h2>
          <p className="text-sm text-ink-100 leading-relaxed">
            Todo hábito, nota e lançamento financeiro que você cria fica protegido por uma
            regra técnica no banco de dados chamada <em>Row Level Security</em> — na prática,
            o próprio banco recusa mostrar seus dados pra qualquer conta que não seja a sua,
            mesmo que alguém tente. A única exceção é quando <strong>você mesmo</strong> convida
            alguém pra compartilhar um item específico — e mesmo assim, só aquele item, não sua
            conta inteira.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-2 text-financa">
            Sobre o acesso administrativo — a parte honesta
          </h2>
          <p className="text-sm text-ink-100 leading-relaxed mb-3">
            Como em praticamente qualquer aplicativo (bancos, apps de notas, redes sociais),
            quem administra a infraestrutura técnica do VidaTrack tem, tecnicamente, a
            capacidade de acessar o banco de dados diretamente. Não vamos fingir que isso não
            existe — seria desonesto.
          </p>
          <p className="text-sm text-ink-100 leading-relaxed mb-3">O nosso compromisso é:</p>
          <ul className="space-y-2 text-sm text-ink-100">
            <li className="flex gap-2">
              <span className="text-financa shrink-0">•</span>
              <span>
                <strong>Nunca</strong> abrimos ou consultamos dados financeiros, hábitos ou
                notas de um usuário específico por curiosidade, teste ou qualquer motivo que
                não seja resolver um problema técnico que você mesmo reportou.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-financa shrink-0">•</span>
              <span>
                O acesso automatizado que o próprio sistema usa (pra mandar lembretes e o
                resumo diário) é registrado num log de auditoria interno, com o motivo de cada
                acesso — não é algo escondido ou usado pra outra coisa.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-financa shrink-0">•</span>
              <span>Nunca vendemos, alugamos ou compartilhamos seus dados com terceiros.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-financa shrink-0">•</span>
              <span>
                Se um dia isso precisar mudar por exigência legal, vamos avisar antes, não
                depois.
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-2 text-nota">
            O que a gente coleta, de fato
          </h2>
          <ul className="space-y-1.5 text-sm text-ink-100">
            <li>• E-mail e nome — pra você logar e ser identificado</li>
            <li>• Os dados que você mesmo cadastra (hábitos, notas, lançamentos)</li>
            <li>
              • Um evento anônimo de "página vista" a cada navegação — sem IP, sem identificador
              de usuário, só pra saber quais partes do app são mais usadas
            </li>
            <li>• Localização (latitude/longitude), só se você escolher definir uma, pra previsão do tempo</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-2">Seus dados são só seus</h2>
          <p className="text-sm text-ink-100 leading-relaxed">
            Você pode excluir qualquer item a qualquer momento (com uma lixeira de segurança
            pros principais). Se quiser encerrar sua conta e apagar tudo permanentemente, é só
            entrar em contato — não existe letra miúda pra dificultar isso.
          </p>
        </section>
      </div>

      <p className="text-xs text-ink-400 mt-10">
        Última atualização: seguimos revisando este texto conforme o VidaTrack cresce.
      </p>
    </main>
  );
}

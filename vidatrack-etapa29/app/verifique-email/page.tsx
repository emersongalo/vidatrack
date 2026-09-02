import Link from "next/link";

export default function VerifiqueEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-habito-soft border border-habito/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-habito text-xl">✓</span>
        </div>
        <h1 className="text-xl font-display font-semibold mb-2">
          Confira seu e-mail
        </h1>
        <p className="text-ink-400 text-sm">
          Enviamos um link de confirmação. Abra sua caixa de entrada (e o
          spam) e clique no link para ativar sua conta.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 text-sm text-ink-400 hover:text-ink-100 transition"
        >
          ← Voltar para o login
        </Link>
      </div>
    </main>
  );
}

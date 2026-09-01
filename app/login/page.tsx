import Link from "next/link";
import Image from "next/image";
import { entrar, cadastrar, entrarComGoogle } from "./actions";
import { BotaoInstalarSempre } from "@/components/BotaoInstalarSempre";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { erro?: string; cadastro?: string };
}) {
  return (
    <main className="min-h-screen grid md:grid-cols-2">
      {/* Lado esquerdo: o trilho — assinatura visual que une os 3 módulos */}
      <div className="hidden md:flex relative flex-col justify-between p-12 bg-base-800 overflow-hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" />
            <p className="font-display text-2xl font-semibold tracking-tight">
              VidaTrack
            </p>
          </div>
          <p className="text-ink-400 mt-1 text-sm">
            hábitos · notas · finanças, num único trilho
          </p>
        </div>

        <div className="relative flex-1 flex items-center my-10">
          <div className="absolute left-6 top-0 bottom-0 w-[2px] trilho-linha rounded-full" />
          <div className="space-y-16 pl-16">
            <Estacao
              cor="habito"
              titulo="Hábitos"
              texto="Constância visível, dia após dia."
            />
            <Estacao
              cor="nota"
              titulo="Notas"
              texto="Ideias organizadas, do jeito que fizer sentido."
            />
            <Estacao
              cor="financa"
              titulo="Finanças"
              texto="Cada real, com clareza."
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-ink-400 text-xs">
            Gratuito. Feito para ser usado todos os dias.
          </p>
          <Link href="/privacidade" className="text-ink-400 text-xs hover:text-ink-100 transition underline">
            Como cuidamos da sua privacidade
          </Link>
        </div>
      </div>

      {/* Lado direito: formulário */}
      <div className="flex items-start md:items-center justify-center p-6 pt-10 md:p-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6 md:hidden">
            <Image src="/icons/icon-192.png" alt="" width={40} height={40} className="rounded-xl" />
            <div>
              <h1 className="text-xl font-display font-semibold leading-none">VidaTrack</h1>
              <p className="text-ink-400 text-xs mt-1">hábitos · notas · finanças</p>
            </div>
          </div>

          <BotaoInstalarSempre />

          <h2 className="text-xl font-display font-semibold mb-6">
            Entrar na sua conta
          </h2>

          {searchParams.erro && (
            <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
              {decodeURIComponent(searchParams.erro)}
            </p>
          )}
          {searchParams.cadastro === "ok" && (
            <p className="mb-4 text-sm text-habito bg-habito-soft border border-habito/30 rounded-lg px-3 py-2">
              Conta criada. Verifique seu e-mail para confirmar o acesso.
            </p>
          )}

          <form action={entrarComGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 border border-base-600 rounded-lg py-2.5 hover:bg-base-800 transition text-sm"
            >
              <GoogleIcon />
              Continuar com Google
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-base-600" />
            <span className="text-xs text-ink-400">ou com e-mail</span>
            <div className="h-px flex-1 bg-base-600" />
          </div>

          <form action={entrar} className="space-y-3">
            <Campo id="email" name="email" tipo="email" rotulo="E-mail" />
            <Campo id="senha" name="senha" tipo="password" rotulo="Senha" />
            <div className="text-right">
              <Link href="/esqueci-senha" className="text-xs text-ink-400 hover:text-ink-100 transition">
                Esqueci minha senha
              </Link>
            </div>
            <button
              type="submit"
              className="w-full mt-1 bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
            >
              Entrar
            </button>
          </form>

          <details className="mt-6 group">
            <summary className="text-sm text-ink-400 cursor-pointer hover:text-ink-100 transition list-none">
              Ainda não tem conta? <span className="underline">Criar conta</span>
            </summary>
            <form action={cadastrar} className="space-y-3 mt-4">
              <Campo id="nome" name="nome" tipo="text" rotulo="Nome" />
              <Campo id="email-cad" name="email" tipo="email" rotulo="E-mail" />
              <Campo id="senha-cad" name="senha" tipo="password" rotulo="Senha (mín. 6 caracteres)" />
              <button
                type="submit"
                className="w-full border border-base-600 rounded-lg py-2.5 hover:bg-base-800 transition"
              >
                Criar conta
              </button>
            </form>
          </details>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.5 29.3 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.3-.3-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.5 29.3 3.5 24 3.5c-7.6 0-14.2 4.3-17.6 10.6z"/>
      <path fill="#4CAF50" d="M24 44.5c5.2 0 9.9-1.8 13.5-4.8l-6.2-5.3c-2 1.4-4.6 2.3-7.3 2.3-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.7 40 16.3 44.5 24 44.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.3C40.5 36.4 44.5 30.7 44.5 24c0-1.2-.1-2.3-.3-3.5z"/>
    </svg>
  );
}

function Estacao({
  cor,
  titulo,
  texto,
}: {
  cor: "habito" | "nota" | "financa";
  titulo: string;
  texto: string;
}) {
  const cores = {
    habito: "bg-habito",
    nota: "bg-nota",
    financa: "bg-financa",
  };
  return (
    <div className="relative">
      <div
        className={`absolute -left-[46px] top-1 w-3 h-3 rounded-full ${cores[cor]} ring-4 ring-base-800`}
      />
      <p className="font-display font-semibold">{titulo}</p>
      <p className="text-ink-400 text-sm mt-1 max-w-[220px]">{texto}</p>
    </div>
  );
}

function Campo({
  id,
  name,
  tipo,
  rotulo,
}: {
  id: string;
  name: string;
  tipo: string;
  rotulo: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-ink-400 mb-1">
        {rotulo}
      </label>
      <input
        id={id}
        name={name}
        type={tipo}
        required
        className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
      />
    </div>
  );
}

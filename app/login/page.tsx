import Link from "next/link";
import Image from "next/image";
import { entrar, cadastrar } from "./actions";
import { BotaoInstalarSempre } from "@/components/BotaoInstalarSempre";
import { BotaoEntrarGoogle } from "@/components/BotaoEntrarGoogle";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { erro?: string; cadastro?: string; tab?: string };
}) {
  const isCadastro = searchParams.tab === "cadastro";

  return (
    <main className="min-h-screen min-h-[100dvh] grid md:grid-cols-2 bg-[#08090d] text-neutral-100 font-body relative overflow-hidden selection:bg-emerald-500/25 selection:text-emerald-200">
      
      {/* Luzes Radiais de Fundo (Aura Tecnológica) */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-amber-500/10 blur-[140px] rounded-full" />

      {/* LADO ESQUERDO: O Trilho Cyberpunk / Minimalista */}
      <div className="hidden md:flex relative flex-col justify-between p-14 border-r border-neutral-800/80 bg-gradient-to-b from-neutral-950/80 via-[#0a0c12]/90 to-neutral-950/80 backdrop-blur-xl">
        
        {/* Topo / Marca */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg shadow-emerald-500/20">
              <Image src="/icons/icon-192.png" alt="Logo VidaTrack" fill className="object-cover" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                VidaTrack
              </p>
              <p className="text-xs text-neutral-500 font-mono tracking-wider uppercase">
                Hábitos · Finanças · Foco
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/apresentacao"
              className="group inline-flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-4 py-2 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition duration-200"
            >
              <span>Explorar tour interativo</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        {/* Centro: O Trilho de Dados Ativo */}
        <div className="relative my-auto py-12 pl-14">
          {/* Linha de Feixe Contínuo com Glow */}
          <div className="absolute left-4 top-4 bottom-4 w-[2px] bg-gradient-to-b from-emerald-500 via-teal-400/80 to-amber-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.4)]" />

          <div className="space-y-14">
            <EstacaoFuturista
              cor="emerald"
              tag="Constância"
              titulo="Hábitos & Foco"
              texto="Sequências diárias, timer de blocos e mapa anual de consistência."
            />
            <EstacaoFuturista
              cor="amber"
              tag="Controle"
              titulo="Finanças em Tempo Real"
              texto="Gastos categorizados, divisão de saldos e gráficos sem planilhas."
            />
          </div>
        </div>

        {/* Rodapé do lado esquerdo */}
        <div className="relative z-10 space-y-1 text-xs text-neutral-500">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Gratuito &bull; Offline &bull; Sem publicidade
          </p>
          <Link href="/privacidade" className="inline-block hover:text-neutral-300 transition text-[11px] underline underline-offset-4 text-neutral-500">
            Segurança e criptografia de dados
          </Link>
        </div>
      </div>

      {/* LADO DIREITO: Painel de Acesso Glassmorphism */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-neutral-900/40 border border-neutral-800/80 backdrop-blur-2xl shadow-2xl shadow-black/80">
          
          {/* Header Mobile */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-md">
              <Image src="/icons/icon-192.png" alt="Logo" fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold leading-none text-white">VidaTrack</h1>
              <p className="text-neutral-400 text-xs mt-1">Hábitos & Finanças</p>
            </div>
          </div>

          <div className="mb-6">
            <BotaoInstalarSempre />
          </div>

          {/* Abas Alternadoras: Entrar vs Criar Conta */}
          <div className="grid grid-cols-2 p-1 bg-neutral-950/80 rounded-xl border border-neutral-800 mb-6">
            <Link
              href="/login"
              className={`py-2 text-xs font-semibold text-center rounded-lg transition-all ${
                !isCadastro
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Entrar
            </Link>
            <Link
              href="/login?tab=cadastro"
              className={`py-2 text-xs font-semibold text-center rounded-lg transition-all ${
                isCadastro
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Criar Conta
            </Link>
          </div>

          {/* Mensagens de Retorno */}
          {searchParams.erro && (
            <div className="mb-5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{decodeURIComponent(searchParams.erro)}</span>
            </div>
          )}
          {searchParams.cadastro === "ok" && (
            <div className="mb-5 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Conta criada! Verifique seu e-mail para validar seu acesso.</span>
            </div>
          )}

          {/* Login Social */}
          <BotaoEntrarGoogle />

          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <span className="relative bg-[#0d0e14] px-3 text-[11px] uppercase tracking-wider text-neutral-500 font-mono">
              ou credenciais
            </span>
          </div>

          {/* Formulários dinâmicos conforme a Tab */}
          {!isCadastro ? (
            <form action={entrar} className="space-y-4">
              <CampoCyber id="email" name="email" tipo="email" rotulo="E-mail" placeholder="seu@email.com" />
              <CampoCyber id="senha" name="senha" tipo="password" rotulo="Senha" placeholder="••••••••" />
              
              <div className="flex justify-end pt-1">
                <Link href="/esqueci-senha" className="text-xs text-neutral-400 hover:text-emerald-400 transition">
                  Esqueci minha senha
                </Link>
              </div>

              <button
                type="submit"
                className="w-full mt-2 relative group overflow-hidden bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-[length:200%_auto] hover:bg-right text-neutral-950 font-semibold rounded-xl py-3 text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 active:scale-[0.99] transition-all duration-300 cursor-pointer"
              >
                Acessar Plataforma →
              </button>
            </form>
          ) : (
            <form action={cadastrar} className="space-y-4">
              <CampoCyber id="nome" name="nome" tipo="text" rotulo="Nome de Usuário" placeholder="Como quer ser chamado?" />
              <CampoCyber id="email-cad" name="email" tipo="email" rotulo="E-mail de Acesso" placeholder="seu@email.com" />
              <CampoCyber id="senha-cad" name="senha" tipo="password" rotulo="Defina uma Senha" placeholder="Mínimo 6 caracteres" />

              <button
                type="submit"
                className="w-full mt-2 relative group overflow-hidden bg-gradient-to-r from-emerald-400 to-teal-300 text-neutral-950 font-semibold rounded-xl py-3 text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 active:scale-[0.99] transition-all duration-200 cursor-pointer"
              >
                Criar Conta Gratuita →
              </button>
            </form>
          )}

        </div>
      </div>
    </main>
  );
}

// Estação Tecnológica no Trilho
function EstacaoFuturista({
  cor,
  tag,
  titulo,
  texto,
}: {
  cor: "emerald" | "amber";
  tag: string;
  titulo: string;
  texto: string;
}) {
  const isEmerald = cor === "emerald";

  return (
    <div className="relative group">
      {/* Nó de Conexão com Halo Iluminado */}
      <div
        className={`absolute -left-[45px] top-1.5 w-3.5 h-3.5 rounded-full ${
          isEmerald
            ? "bg-emerald-400 shadow-[0_0_12px_#34d399]"
            : "bg-amber-400 shadow-[0_0_12px_#fbbf24]"
        } ring-4 ring-[#08090d] transition-transform duration-300 group-hover:scale-125`}
      />

      <span
        className={`text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border ${
          isEmerald
            ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            : "text-amber-400 border-amber-500/30 bg-amber-500/10"
        }`}
      >
        {tag}
      </span>
      <h3 className="font-display font-semibold text-lg text-neutral-100 mt-1">{titulo}</h3>
      <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-[280px] leading-relaxed">
        {texto}
      </p>
    </div>
  );
}

// Input Futurista com Microinterações
function CampoCyber({
  id,
  name,
  tipo,
  rotulo,
  placeholder,
}: {
  id: string;
  name: string;
  tipo: string;
  rotulo: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-neutral-400 mb-1.5">
        {rotulo}
      </label>
      <input
        id={id}
        name={name}
        type={tipo}
        placeholder={placeholder}
        required
        className="w-full bg-neutral-950/60 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/50 transition-all duration-200"
      />
    </div>
  );
}
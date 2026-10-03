import { TimerFoco } from "@/components/TimerFoco";

// Etapa 237 — timer de foco completo (pomodoro, hábito, histórico)
export default function TimerPage() {
  return (
    <main className="max-w-sm lg:max-w-md mx-auto px-6 pt-2 pb-8 lg:pt-16">
      <h1 className="text-3xl font-display font-bold mb-5">Timer de foco</h1>
      <TimerFoco />
      <p className="text-xs text-ink-400 text-center mt-6">
        A contagem continua mesmo se você sair da tela. No fim toca um sininho e o celular vibra.
      </p>
    </main>
  );
}

// Etapa 361 — "Hora de sair": um aviso extra antes do compromisso com
// local, com o botão de rota. Fica guardado na mesma lista de lembretes
// (minutos antes), marcado com +100000 — sem precisar mudar o banco.
export const BASE_SAIR = 100000;

export const ehLembreteSair = (v: number) => v >= BASE_SAIR;
/** minutos antes do início (para os dois tipos de aviso) */
export const minutosDoLembrete = (v: number) => (v >= BASE_SAIR ? v - BASE_SAIR : v);
export const lembreteSair = (minutos: number) => BASE_SAIR + Math.max(0, Math.round(minutos));

export const OPCOES_SAIR = [15, 30, 45, 60, 90];

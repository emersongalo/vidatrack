const BASE_URL = "https://api.telegram.org";

function urlBot(metodo: string) {
  return `${BASE_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}/${metodo}`;
}

export async function enviarMensagemTelegram(chatId: string, texto: string) {
  await fetch(urlBot("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: "HTML" }),
  });
}

type AtualizacaoTelegram = {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
};

export async function buscarAtualizacoesTelegram(offset: number): Promise<AtualizacaoTelegram[]> {
  const resposta = await fetch(urlBot("getUpdates") + `?offset=${offset}&timeout=0`);
  const dados = await resposta.json();
  return dados.result ?? [];
}

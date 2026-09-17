/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
  experimental: {
    // Por padrão, o Next re-busca do zero TODA rota dinâmica (que usa
    // cookies/searchParams — o caso de quase todas as nossas páginas)
    // a cada navegação, mesmo que você tenha visitado ela há 2
    // segundos. Isso configura o cache do roteador no navegador pra
    // reaproveitar uma rota já visitada por um tempo, em vez de
    // buscar tudo de novo — é o que dá aquela sensação de "trocar de
    // aba instantaneamente" depois da primeira visita.
    //
<<<<<<< HEAD
    // dynamic: 120 -> Início/Contas/Extrato/Hoje/etc. ficam "quentes"
    //                  por 2 minutos (era 30s na Etapa 118 — aumentado
    //                  agora porque na prática 30s expirava rápido
    //                  demais e voltava a mostrar esqueleto de carregamento
    //                  com frequência incômoda ao alternar de aba).
=======
    // dynamic: 30  -> Início/Contas/Extrato/Hoje/etc. ficam "quentes"
    //                 por 30s. Trocar entre abas já visitadas nesse
    //                 intervalo é instantâneo, sem ida ao servidor.
>>>>>>> 84bfed6dc8f4e4b4df3c45d3b383ef6cfdc723b1
    // static: 180  -> páginas sem dados por usuário (ex: /financas/mais)
    //                 ficam "quentes" por 3 minutos.
    //
    // Qualquer ação que grava algo (criar conta, lançar transação
    // etc.) chama `revalidatePath` — isso invalida o cache na hora
    // pra quem fez a mudança, então nenhuma tela fica com dado velho
    // depois de uma edição sua. O único efeito colateral possível é
<<<<<<< HEAD
    // ver um saldo de até 2 minutos atrás ao voltar rapidamente pra
    // uma aba — atualiza sozinho passado esse tempo.
    staleTimes: {
      dynamic: 120,
=======
    // ver um saldo de até 30s atrás ao voltar rapidamente pra uma aba
    // — atualiza sozinho passado esse tempo.
    staleTimes: {
      dynamic: 30,
>>>>>>> 84bfed6dc8f4e4b4df3c45d3b383ef6cfdc723b1
      static: 180,
    },
  },
};

module.exports = nextConfig;

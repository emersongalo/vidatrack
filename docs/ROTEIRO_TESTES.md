# Roteiro de testes — VidaTrack (Etapas 203 a 215)

Faça no celular, logado na sua conta. Use valores pequenos e apague no final (item 15).
Marque ✅ ou anote o que deu errado (com print).

## 1. Saldo não desconta lançamento futuro
- [ ] Anote o "Saldo em contas" de agora.
- [ ] Lance uma despesa de R$ 10,00 com data do mês que vem.
- [ ] O saldo **não muda**. O lançamento aparece com o selo **"A pagar"**.

## 2. Paguei / desfazer
- [ ] Nesse lançamento, toque em **"✓ Paguei"** → saldo cai R$ 10,00 e aparece "Pago dd/mm".
- [ ] Toque no ↶ (desfazer) → saldo volta.

## 3. Recorrente começando no mês que vem
- [ ] Lance R$ 20,00, data dia 10 do mês que vem, marque **Repetir todo mês → Sem data pra acabar**.
- [ ] Nada aparece no mês atual; o saldo não muda.
- [ ] No mês que vem aparece com **"↻ todo mês"**.
- [ ] Em Mais → Recorrentes ela aparece com o nome certo.

## 4. Editar recorrente
- [ ] Abra o lançamento do item 3 → Editar. Aparece o quadro "↻ Esse lançamento repete todo mês".
- [ ] Mude o valor pra R$ 25,00 e a data pro dia 12, com **"Este e os próximos"** → salvar.
- [ ] Em Recorrentes ela passa a ser dia 12, R$ 25,00.
- [ ] Edite de novo marcando **"Parar de repetir depois deste"** → some de Recorrentes (ou fica com data final).

## 5. Compra parcelada
- [ ] Lance R$ 100,00 como **Compra parcelada em 3×, "Valor é o total"**. A prévia mostra 3× de R$ 33,33.
- [ ] Aparecem 3 lançamentos: (1/3) este mês, (2/3) e (3/3) nos próximos. O último é R$ 33,34.
- [ ] Edite a (2/3) → "Excluir esta e as próximas parcelas" → somem a 2/3 e a 3/3.

## 6. Transferência
- [ ] Mais → Transferir: R$ 5,00 do banco pra outra conta.
- [ ] Um saldo cai R$ 5, o outro sobe R$ 5; **Receitas/Despesas do mês não mudam**.
- [ ] Apague um lado no Extrato → o outro some junto.

## 7. Cartão de crédito (se tiver conta tipo Cartão)
- [ ] O cartão aparece em "Cartões de crédito", fora do "Saldo em contas".
- [ ] Ver fatura → **Pagar fatura** abre a transferência preenchida.

## 8. Extrato
- [ ] A barra `‹ mês ›` troca de mês; tocar no nome abre os atalhos e o "Escolher datas".
- [ ] "Agendados" mostra só o que é futuro, o mais próximo primeiro, com "Ainda não pago nesse período".
- [ ] Busca: digite "parcel" → acha as parcelas; troque a conta no seletor ao lado.
- [ ] Nada fica cortado ou rolando pro lado.

## 9. Hábitos
- [ ] Crie um hábito **"X por semana" = 2**. Na tela Hoje aparece "0/2 na semana".
- [ ] Marque hoje → "1/2 na semana". Ao chegar em 2 → "Meta da semana ✓".

## 10. Ler cupom (foto)
- [ ] Toque no **+** → no Gasto rápido, toque em **📷 Cupom** e fotografe um cupom fiscal (reto e com boa luz).
- [ ] Valor, descrição (nome da loja) e data do cupom são preenchidos. Confira e lance.

## 11. Dinheiro de hoje
- [ ] Na tela **Hoje** aparece "💰 Dinheiro de hoje" com os lançamentos do dia e as recorrentes que vencem hoje.
- [ ] O "✓ Paguei" funciona dali mesmo.

## 12. Conquistas
- [ ] Hábitos → Estatísticas → **🏆 Conquistas** mostra os selos e as barras de progresso.

## 13. Bloqueio por PIN (opcional)
- [ ] Perfil → **Ligar bloqueio** → crie um PIN de 4 a 6 números.
- [ ] Feche o app e abra de novo → pede o PIN. PIN errado mostra "PIN incorreto".
- [ ] Saia do app por mais de 5 minutos → pede o PIN de novo; por menos de 5 minutos → não pede.
- [ ] Perfil → **Trocar PIN** e **Desligar** funcionam (pedem o PIN atual).
- [ ] "Esqueci o PIN" → sai da conta; ao entrar de novo o bloqueio está desligado.

## 14. Avisos novos (automáticos)
- [ ] Com um orçamento perto do limite, chega o aviso de **80%** (uma vez por categoria no mês).
- [ ] No dia 1º, por volta das 9h, chega o **resumo do mês anterior** (se "Resumos da semana e do mês" estiver ligado).

## Etapa 215 — novidades
- [ ] **Previsão:** em Finanças aparece "Vai sobrar R$ X" com "dá pra gastar R$ Y por dia". Toque em "Ver o que ainda vai entrar e sair" e confira a lista (agendados, ↻ todo mês, cartão).
- [ ] **Categoria automática:** novo lançamento, digite uma descrição que você já usou (ex: "Uber") → a categoria é escolhida sozinha ("✨ Sugerida"). Trocar a categoria na mão deve funcionar normal. No Gasto rápido do "+" também.
- [ ] **Alertas:** se alguma categoria estiver bem acima da média, aparece o aviso 📈 no topo de Finanças (dá pra fechar no X). Em Análise aparece "Fora do normal".
- [ ] **Contas fixas detectadas:** em Recorrentes, se tiver algo que se repete todo mês, aparece "Parecem contas fixas" → "Cadastrar como recorrente".
- [ ] **Metas:** cada meta mostra "guarde R$ X/mês até ..."; teste Guardar, Retirar e o lápis (editar). As metas aparecem também na tela de Finanças.
- [ ] **Fatura:** na tela da fatura aparece o "Melhor dia pra comprar". O aviso chega 3 dias antes, na véspera e no dia (8h10).
- [ ] **Exportar:** Mais → Exportar e backup → baixe "Este ano" e abra no Excel/Planilhas (colunas certas, valores com vírgula). Baixe o backup .json. No app Android (versão nova) o arquivo vai pra Downloads.
- [ ] **Diário:** na tela Hoje, "Como está seu dia?" → toque num emoji, escreva uma frase. Hábitos → Estatísticas → 🙂 Diário mostra o histórico.
- [ ] **Lembrete inteligente:** depois de marcar um hábito ~5 vezes no mesmo horário, aparece a sugestão "Mover lembrete pra HH:MM".
- [ ] **Retrospectiva:** Estatísticas → 🎉 Retrospectiva do ano. "Compartilhar" copia um texto (sem valores em dinheiro).
- [ ] **Busca:** no Painel, 🔍 → busque um nome de lançamento, um hábito e um valor (ex: 45,90).
- [ ] **Aparência:** Perfil → Aparência → texto Grande/Maior e Alto contraste. Feche e abra o app: continua igual.
- [ ] **Widget (app novo 1.0.9):** segure na tela inicial → Widgets → VidaTrack "Previsão do mês".

## 15. Limpeza
- [ ] Apague os lançamentos, a recorrência e o hábito de teste.

Se algo falhar: print da tela + o que você fez antes. Os erros de formulário também ficam no Painel de erros (/admin/erros).

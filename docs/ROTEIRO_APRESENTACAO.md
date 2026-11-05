# Roteiro da apresentação - 8 a 10 minutos

## Preparação

Abra o site e selecione **Reiniciar demonstração**. Use dados fictícios. A referência de validade e vencimento é 03/11/2026. O modo de apresentação fica no menu lateral e aceita as setas do teclado. O PowerPoint permite apresentar sem conexão com o site.

## Sequência sugerida

| Tempo | O que mostrar | Mensagem principal |
| --- | --- | --- |
| 0:00 a 1:00 | Capa e contexto | Reunir atendimento, entrega e recebimento em um pedido rastreável |
| 1:00 a 2:30 | Formulário e novo ticket | Uma conversa gera uma solicitação estruturada |
| 2:30 a 4:00 | Quadro e personalizados | Cada pedido tem etapa, itens e condições visíveis |
| 4:00 a 5:30 | Estoque e separação | Validade e embalagem orientam a entrega |
| 5:30 a 7:00 | Conclusão e financeiro | A baixa ocorre uma vez; fiado mantém saldo e vencimento |
| 7:00 a 8:00 | Modelo e próximos passos | Validar a operação antes de construir integrações e backend |
| 8:00 a 10:00 | Perguntas de validação | Confirmar responsabilidades e regras que faltam |

## Demonstração guiada

1. No painel, mostre 6 pedidos em andamento, R$ 480,00 a receber e o lote de queijo bloqueado. Esses números são exemplos, não indicadores reais da empresa.
2. Abra o formulário. Use nome `Cliente Demonstração`, contato `EXEMPLO`, data desejada `06/11/2026`, um produto e pagamento Pix. Envie e abra o ticket pelo protocolo.
3. No quadro, abra o pedido e avance as etapas. Mostre a sugestão de lote e embalagem. O protótipo conclui o pedido à vista com pagamento confirmado por hipótese de demonstração.
4. Em Personalizados, abra `ES-1046`, de Clara. Mostre a descrição do kit e registre a aprovação de orçamento. Explique que a produção precisará conservar evidência e revisão do orçamento.
5. Em Estoque, compare `QMC-1026` bloqueado com `QMC-1101` liberado. A regra é escolher a menor validade entre lotes liberados.
6. Abra `ES-1045`, da Pousada Ipê, que já está Pronto. O total é R$ 276,00, a prazo, vencimento 12/11/2026. Conclua.
7. Em Estoque, o lote `QMC-1101` passa de 26 para 22 unidades e `SAL-1029` de 17 para 15, caso nenhum outro pedido com esses produtos tenha sido concluído.
8. Em Financeiro, a conta da Pousada aparece com saldo R$ 276,00. Registre R$ 100,00 e mostre o saldo de R$ 176,00. Os totais do painel também mudam.
9. No histórico do Empório Raízes, mostre a recompra. Ela gera novo pedido sujeito a confirmação comercial.
10. Encerre com os pontos a validar. Reinicie a demonstração antes de uma nova sessão.

## Perguntas para os responsáveis

- O formulário pede todas as informações necessárias para começar o atendimento?
- Quem aprova pedidos personalizados e quais detalhes alteram o preço?
- Quem autoriza fiado, com qual limite e quantos vencimentos?
- A conclusão representa entrega ou expedição?
- A operação confirma o bloqueio online com até 7 dias de validade?
- Quais produtos precisam de pesagem, refrigeração e embalagem especial?
- Qual é o mínimo real de atacado?
- Quais módulos precisam entrar no primeiro lançamento?

## Respostas curtas para limites da demo

**Já conversa com WhatsApp?** O fluxo começa por um link compartilhado na conversa. Integração, envio e recebimento automáticos ainda não existem.

**Os dados são reais?** Não. Os exemplos são fictícios e permanecem neste navegador.

**Já existe banco conectado?** O SQL e o dicionário são propostas validadas separadamente. O protótipo não usa esse banco.

**Já calcula lucro e DRE?** Não. O painel mostra pedidos e recebimentos de exemplo. DRE precisa de custos, competência e despesas definidos.

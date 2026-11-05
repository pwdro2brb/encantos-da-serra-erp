# Dicionário de dados - Encantos da Serra

Proposta inicial: **29 tabelas**. Gerado diretamente do DDL validado em SQLite 3. O protótipo web usa localStorage e não se conecta a este modelo.

## Convenções

- `id`: chave primária inteira. `*_id`: chave estrangeira quando indicada.
- `*_centavos`: inteiro monetário em BRL, sem ponto flutuante. R$ 48,00 = 4800.
- `*_milesimos`: milésimos da unidade do produto. 2 unidades = 2000; 1,250 kg = 1250.
- Datas de negócio: `AAAA-MM-DD`, na zona America/Sao_Paulo. Instantes: ISO 8601 em UTC.
- Flags: 0 = não; 1 = sim. Inativar cadastros preserva o histórico.
- Contatos e documentos reais exigem política de acesso e retenção antes da produção.
- Valores de enumeração, limites, unicidade e checks completos constam em `schema.sql`.
- SQLite aceita tipagem dinâmica: a API de produção deve validar tipos, datas, documentos e escalas.

## alocacoes_lotes

Rastreabilidade entre itens vendidos e lotes separados.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `item_pedido_id` | INTEGER | Sim | itens_pedido.id |
| `lote_id` | INTEGER | Sim | lotes.id |
| `quantidade_milesimos` | INTEGER | Sim | - |
| `custo_unitario_snapshot_centavos` | INTEGER | Sim | - |
| `status` | TEXT | Sim | - |

## auditoria

Registro técnico das alterações relevantes.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `entidade` | TEXT | Sim | - |
| `entidade_id` | TEXT | Sim | - |
| `acao` | TEXT | Sim | - |
| `usuario_id` | INTEGER | Não | usuarios.id |
| `instante_utc` | TEXT | Sim | padrão: CURRENT_TIMESTAMP |
| `detalhes` | TEXT | Não | - |

## canais

Origem do contato: WhatsApp, Instagram, formulário e presencial.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `nome` | TEXT | Sim | - |
| `ativo` | INTEGER | Sim | padrão: 1 |

## categorias

Agrupamento dos produtos.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `nome` | TEXT | Sim | - |

## certificacoes_produtor

Certificações, evidências e datas de validade.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `produtor_id` | INTEGER | Sim | produtores.id |
| `tipo` | TEXT | Sim | - |
| `numero` | TEXT | Não | - |
| `orgao_emissor` | TEXT | Não | - |
| `emitida_em` | TEXT | Não | - |
| `valida_ate` | TEXT | Não | - |
| `arquivo_uri` | TEXT | Não | - |
| `status` | TEXT | Sim | - |

## clientes

Cadastro B2C/B2B, contato, preferências e política de crédito.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `tipo` | TEXT | Sim | - |
| `nome` | TEXT | Sim | - |
| `documento` | TEXT | Não | - |
| `telefone` | TEXT | Não | - |
| `email` | TEXT | Não | - |
| `canal_origem_id` | INTEGER | Sim | canais.id |
| `tabela_comercial_id` | INTEGER | Não | tabelas_comerciais.id |
| `preferencias` | TEXT | Não | - |
| `fiado_autorizado` | INTEGER | Sim | padrão: 0 |
| `limite_credito_centavos` | INTEGER | Sim | padrão: 0 |
| `ativo` | INTEGER | Sim | padrão: 1 |
| `criado_em` | TEXT | Sim | padrão: CURRENT_TIMESTAMP |

## contas_pagar

Obrigações de compras e despesas para evolução do financeiro.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `ordem_compra_id` | INTEGER | Não | ordens_compra.id |
| `produtor_id` | INTEGER | Não | produtores.id |
| `descricao` | TEXT | Sim | - |
| `categoria` | TEXT | Sim | - |
| `valor_centavos` | INTEGER | Sim | - |
| `competencia_em` | TEXT | Sim | - |
| `vencimento_em` | TEXT | Sim | - |
| `cancelada_em` | TEXT | Não | - |
| `motivo_cancelamento` | TEXT | Não | - |

## contas_receber

Título da venda. Saldo deriva dos pagamentos válidos.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `pedido_id` | INTEGER | Sim | pedidos.id |
| `valor_centavos` | INTEGER | Sim | - |
| `emitida_em` | TEXT | Sim | - |
| `vencimento_em` | TEXT | Sim | - |
| `cancelada_em` | TEXT | Não | - |
| `motivo_cancelamento` | TEXT | Não | - |

## enderecos_clientes

Endereços reutilizáveis do cliente. O pedido conserva uma cópia da entrega.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `cliente_id` | INTEGER | Sim | clientes.id |
| `descricao` | TEXT | Não | - |
| `cep` | TEXT | Sim | - |
| `logradouro` | TEXT | Sim | - |
| `numero` | TEXT | Não | - |
| `complemento` | TEXT | Não | - |
| `bairro` | TEXT | Não | - |
| `cidade` | TEXT | Sim | - |
| `uf` | TEXT | Sim | - |
| `principal` | INTEGER | Sim | padrão: 0 |

## expedicoes

Separação, embalagem, envio e entrega do pedido.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `pedido_id` | INTEGER | Sim | pedidos.id |
| `status` | TEXT | Sim | - |
| `responsavel_id` | INTEGER | Não | usuarios.id |
| `embalagem_termica` | INTEGER | Sim | padrão: 0 |
| `protecao_garrafas` | INTEGER | Sim | padrão: 0 |
| `transportadora` | TEXT | Não | - |
| `rastreio` | TEXT | Não | - |
| `enviado_em` | TEXT | Não | - |
| `entregue_em` | TEXT | Não | - |
| `observacoes` | TEXT | Não | - |

## historico_pedidos

Transições de etapa com operador e instante.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `pedido_id` | INTEGER | Sim | pedidos.id |
| `status_anterior` | TEXT | Não | - |
| `status_novo` | TEXT | Sim | - |
| `alterado_em` | TEXT | Sim | padrão: CURRENT_TIMESTAMP |
| `usuario_id` | INTEGER | Não | usuarios.id |
| `comentario` | TEXT | Não | - |

## itens_compra

Produtos, quantidades negociadas e peso esperado.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `ordem_compra_id` | INTEGER | Sim | ordens_compra.id |
| `produto_id` | INTEGER | Sim | produtos.id |
| `quantidade_milesimos` | INTEGER | Sim | - |
| `custo_unitario_centavos` | INTEGER | Sim | - |
| `peso_esperado_gramas` | INTEGER | Não | - |

## itens_pedido

Produtos e preços históricos da venda.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `pedido_id` | INTEGER | Sim | pedidos.id |
| `produto_id` | INTEGER | Sim | produtos.id |
| `nome_snapshot` | TEXT | Sim | - |
| `unidade_snapshot` | TEXT | Sim | - |
| `quantidade_milesimos` | INTEGER | Sim | - |
| `preco_unitario_centavos` | INTEGER | Sim | - |
| `desconto_centavos` | INTEGER | Sim | padrão: 0 |
| `subtotal_centavos` | INTEGER | Sim | - |
| `observacoes` | TEXT | Não | - |

## itens_recebimento

Liga o item comprado ao lote recebido e ao peso aferido.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `recebimento_id` | INTEGER | Sim | recebimentos_compra.id |
| `item_compra_id` | INTEGER | Sim | itens_compra.id |
| `lote_id` | INTEGER | Sim | lotes.id |
| `quantidade_milesimos` | INTEGER | Sim | - |
| `peso_aferido_gramas` | INTEGER | Não | - |
| `divergencia_justificativa` | TEXT | Não | - |

## lotes

Origem, fabricação, validade, localização, custo e saldo físico.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `produto_id` | INTEGER | Sim | produtos.id |
| `produtor_id` | INTEGER | Sim | produtores.id |
| `codigo` | TEXT | Sim | - |
| `fabricado_em` | TEXT | Sim | - |
| `validade_em` | TEXT | Sim | - |
| `recebido_em` | TEXT | Sim | - |
| `localizacao` | TEXT | Sim | - |
| `custo_unitario_centavos` | INTEGER | Sim | - |
| `saldo_milesimos` | INTEGER | Sim | padrão: 0 |
| `refrigerado` | INTEGER | Sim | - |

## movimentos_estoque

Livro de entradas, vendas, perdas, ajustes e estornos.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `chave_idempotencia` | TEXT | Sim | - |
| `lote_id` | INTEGER | Sim | lotes.id |
| `tipo` | TEXT | Sim | - |
| `quantidade_milesimos` | INTEGER | Sim | - |
| `item_pedido_id` | INTEGER | Não | itens_pedido.id |
| `item_recebimento_id` | INTEGER | Não | itens_recebimento.id |
| `movimento_origem_id` | INTEGER | Não | movimentos_estoque.id |
| `motivo` | TEXT | Não | - |
| `usuario_id` | INTEGER | Não | usuarios.id |
| `criado_em` | TEXT | Sim | padrão: CURRENT_TIMESTAMP |

## orcamentos_personalizados

Revisões do orçamento e prova de aprovação do cliente.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `personalizado_id` | INTEGER | Sim | personalizados.id |
| `revisao` | INTEGER | Sim | - |
| `valor_centavos` | INTEGER | Sim | - |
| `detalhes` | TEXT | Sim | - |
| `valido_ate` | TEXT | Sim | - |
| `status` | TEXT | Sim | - |
| `criado_em` | TEXT | Sim | padrão: CURRENT_TIMESTAMP |
| `aprovado_em` | TEXT | Não | - |
| `evidencia_aprovacao` | TEXT | Não | - |

## ordens_compra

Pedido de suprimento ao produtor.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `numero` | TEXT | Sim | - |
| `produtor_id` | INTEGER | Sim | produtores.id |
| `status` | TEXT | Sim | - |
| `emitida_em` | TEXT | Sim | - |
| `prevista_em` | TEXT | Sim | - |
| `responsavel_id` | INTEGER | Não | usuarios.id |
| `observacoes` | TEXT | Não | - |

## pagamentos

Recebimentos parciais ou totais com chave de idempotência.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `conta_receber_id` | INTEGER | Sim | contas_receber.id |
| `chave_idempotencia` | TEXT | Sim | - |
| `valor_centavos` | INTEGER | Sim | - |
| `recebido_em` | TEXT | Sim | - |
| `meio` | TEXT | Sim | - |
| `referencia` | TEXT | Não | - |
| `usuario_id` | INTEGER | Não | usuarios.id |
| `estornado_em` | TEXT | Não | - |
| `motivo_estorno` | TEXT | Não | - |

## pagamentos_fornecedores

Liquidação parcial ou total de obrigações.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `conta_pagar_id` | INTEGER | Sim | contas_pagar.id |
| `chave_idempotencia` | TEXT | Sim | - |
| `valor_centavos` | INTEGER | Sim | - |
| `pago_em` | TEXT | Sim | - |
| `meio` | TEXT | Sim | - |
| `usuario_id` | INTEGER | Não | usuarios.id |
| `estornado_em` | TEXT | Não | - |
| `motivo_estorno` | TEXT | Não | - |

## pedidos

Ticket comercial, cliente, canal, etapa, prazo e totais acordados.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `numero` | TEXT | Sim | - |
| `chave_idempotencia` | TEXT | Sim | - |
| `cliente_id` | INTEGER | Sim | clientes.id |
| `canal_id` | INTEGER | Sim | canais.id |
| `tipo` | TEXT | Sim | - |
| `status` | TEXT | Sim | - |
| `criado_em` | TEXT | Sim | padrão: CURRENT_TIMESTAMP |
| `entrega_prevista_em` | TEXT | Sim | - |
| `concluido_em` | TEXT | Não | - |
| `condicao_pagamento` | TEXT | Sim | - |
| `vencimento_em` | TEXT | Não | - |
| `aprovador_credito_id` | INTEGER | Não | usuarios.id |
| `responsavel_id` | INTEGER | Não | usuarios.id |
| `endereco_entrega_snapshot` | TEXT | Não | - |
| `tabela_nome_snapshot` | TEXT | Não | - |
| `frete_centavos` | INTEGER | Sim | padrão: 0 |
| `desconto_centavos` | INTEGER | Sim | padrão: 0 |
| `personalizacao_centavos` | INTEGER | Sim | padrão: 0 |
| `total_centavos` | INTEGER | Sim | - |
| `observacoes` | TEXT | Não | - |

## personalizados

Detalhes específicos de cestas, kits e presentes.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `pedido_id` | INTEGER | Sim | pedidos.id |
| `descricao` | TEXT | Sim | - |
| `ocasiao` | TEXT | Não | - |
| `instrucao_embalagem` | TEXT | Não | - |
| `texto_cartao` | TEXT | Não | - |
| `referencia_uri` | TEXT | Não | - |

## precos_comerciais

Faixas de preço por produto e tabela comercial.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `tabela_id` | INTEGER | Sim | tabelas_comerciais.id |
| `produto_id` | INTEGER | Sim | produtos.id |
| `quantidade_minima_milesimos` | INTEGER | Sim | padrão: 1000 |
| `preco_centavos` | INTEGER | Sim | - |

## produtores

Famílias produtoras e localização de origem.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `nome` | TEXT | Sim | - |
| `documento` | TEXT | Não | - |
| `contato` | TEXT | Não | - |
| `municipio` | TEXT | Sim | - |
| `uf` | TEXT | Sim | - |
| `observacoes` | TEXT | Não | - |
| `ativo` | INTEGER | Sim | padrão: 1 |

## produtos

Catálogo, unidade de medida, preço, conservação e embalagem.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `sku` | TEXT | Sim | - |
| `nome` | TEXT | Sim | - |
| `descricao` | TEXT | Não | - |
| `categoria_id` | INTEGER | Sim | categorias.id |
| `unidade` | TEXT | Sim | - |
| `preco_varejo_centavos` | INTEGER | Sim | - |
| `estoque_minimo_milesimos` | INTEGER | Sim | padrão: 0 |
| `refrigerado` | INTEGER | Sim | padrão: 0 |
| `instrucao_embalagem` | TEXT | Não | - |
| `perecivel` | INTEGER | Sim | padrão: 1 |
| `ativo` | INTEGER | Sim | padrão: 1 |

## produtos_produtores

Relação de fornecimento com custo, capacidade mensal e prazo por produto.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `produto_id` | INTEGER | Sim | produtos.id |
| `produtor_id` | INTEGER | Sim | produtores.id |
| `capacidade_mensal_milesimos` | INTEGER | Sim | - |
| `custo_referencia_centavos` | INTEGER | Sim | - |
| `prazo_producao_dias` | INTEGER | Sim | padrão: 0 |

## recebimentos_compra

Cada conferência de uma ordem de compra, permitindo entregas parciais.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `ordem_compra_id` | INTEGER | Sim | ordens_compra.id |
| `recebido_em` | TEXT | Sim | - |
| `conferente_id` | INTEGER | Não | usuarios.id |
| `documento_referencia` | TEXT | Não | - |
| `observacoes` | TEXT | Não | - |

## tabelas_comerciais

Políticas comerciais por perfil e mínimos para atacado.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `nome` | TEXT | Sim | - |
| `perfil` | TEXT | Sim | - |
| `minimo_centavos` | INTEGER | Sim | padrão: 0 |
| `minimo_qtd_milesimos` | INTEGER | Não | - |
| `ativo` | INTEGER | Sim | padrão: 1 |

## usuarios

Operadores internos e perfil de acesso. Autenticação deve integrar um provedor de identidade.

| Coluna | Tipo | Obrigatória | Relação / padrão |
| --- | --- | --- | --- |
| `id` | INTEGER | Sim | PK |
| `nome` | TEXT | Sim | - |
| `email` | TEXT | Sim | - |
| `perfil` | TEXT | Sim | - |
| `ativo` | INTEGER | Sim | padrão: 1 |
| `criado_em` | TEXT | Sim | padrão: CURRENT_TIMESTAMP |

## Regras transacionais a implementar na API

1. Concluir pedido em uma transação: validar etapa, aprovação do orçamento, crédito e prazo; bloquear concorrência de estoque; selecionar lotes FEFO elegíveis; inserir alocações e movimentos; reduzir saldos; criar título financeiro; registrar recebimento apenas se confirmado; salvar histórico e auditoria. Commit somente após todas as etapas.
2. Reutilizar a chave de idempotência na repetição de uma requisição. `numero` do pedido, título por pedido e chaves de movimentos e pagamentos têm unicidade.
3. Revalidar saldo e elegibilidade dos lotes na confirmação. A proposta não reserva estoque automaticamente no recebimento do formulário. Duas sessões concorrentes precisam de serialização no servidor.
4. FEFO: menor `validade_em`, desempate por `recebido_em`. Bloquear online com validade menor ou igual a data de negócio + 7 dias. Alertar com até 15 dias.
5. Snapshot dos preços e custos conserva o histórico. Calcular subtotal a partir da quantidade escalada e arredondar em centavos de forma explícita. Total = itens + frete + personalização - desconto.
6. Aplicar mínimos B2B antes de liberar a tabela. Definir se os mínimos de valor e quantidade são cumulativos e se quantidades de unidades diferentes podem ser somadas.
7. Para fiado, consultar autorização, limite disponível e aprovador. A demonstração apenas exige vencimento e não aplica política de crédito.
8. Recebimento: comparar peso esperado e aferido e aceitar variação absoluta de até 5%, conforme RN03. Fora da tolerância, exigir decisão do conferente e justificativa.
9. Conferir que lote, produto do item, produtor e ordem de compra pertencem à mesma cadeia. Chaves estrangeiras individuais não garantem essas combinações.
10. Movimentos devem ser imutáveis. Corrigir por lançamento de estorno auditado. O saldo em `lotes` é um resumo mantido na mesma transação e conciliado com o livro de movimentos.
11. O trigger de recebimentos cobre inserções. Updates, estornos, contas canceladas e pagamentos a fornecedores também exigem serviço transacional com validação de saldo. Restringir escrita direta.
12. DRE, margem por produtor e curva ABC requerem critérios de competência, custo, perdas, despesas e rateios. O modelo prepara dados, mas os relatórios ainda precisam de definição e implementação.

## Decisões em aberto

- CPF/CNPJ obrigatório em qual momento do atendimento?
- Produtos não perecíveis terão validade obrigatória ou exceção formal?
- Fiado permitirá parcelamento? O modelo inicial prevê um vencimento por pedido.
- Quem aprova personalização, crédito, perdas e estornos?
- Concluir corresponde à entrega efetiva ou à expedição? A demo assume entrega confirmada.
- Qual identidade e estratégia de autorização serão usadas no backend?
- SQLite serve para validar o modelo. A seleção do banco de produção depende da arquitetura e da concorrência esperada.

-- Encantos da Serra | proposta inicial de banco | SQLite 3
-- Independente do protótipo web. Moeda em centavos, quantidades em milésimos da unidade.
-- Habilitar foreign_keys em CADA conexão. Datas ISO 8601. Instantes em UTC.
PRAGMA foreign_keys = ON;
BEGIN;
CREATE TABLE usuarios (
 id INTEGER PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 perfil TEXT NOT NULL CHECK(perfil IN ('administrador','atendimento','estoque','financeiro','compras')),
 ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0,1)), criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE canais (
 id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE, ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0,1))
);
CREATE TABLE tabelas_comerciais (
 id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE, perfil TEXT NOT NULL CHECK(perfil IN ('B2C','B2B')),
 minimo_centavos INTEGER NOT NULL DEFAULT 0 CHECK(minimo_centavos>=0), minimo_qtd_milesimos INTEGER CHECK(minimo_qtd_milesimos>0),
 ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0,1))
);
CREATE TABLE clientes (
 id INTEGER PRIMARY KEY, tipo TEXT NOT NULL CHECK(tipo IN ('B2C','B2B')), nome TEXT NOT NULL,
 documento TEXT UNIQUE, telefone TEXT, email TEXT, canal_origem_id INTEGER NOT NULL REFERENCES canais(id),
 tabela_comercial_id INTEGER REFERENCES tabelas_comerciais(id), preferencias TEXT,
 fiado_autorizado INTEGER NOT NULL DEFAULT 0 CHECK(fiado_autorizado IN (0,1)), limite_credito_centavos INTEGER NOT NULL DEFAULT 0 CHECK(limite_credito_centavos>=0),
 ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0,1)), criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(telefone IS NOT NULL OR email IS NOT NULL)
);
CREATE TABLE enderecos_clientes (
 id INTEGER PRIMARY KEY, cliente_id INTEGER NOT NULL REFERENCES clientes(id), descricao TEXT,
 cep TEXT NOT NULL, logradouro TEXT NOT NULL, numero TEXT, complemento TEXT, bairro TEXT,
 cidade TEXT NOT NULL, uf TEXT NOT NULL CHECK(length(uf)=2), principal INTEGER NOT NULL DEFAULT 0 CHECK(principal IN (0,1))
);
CREATE UNIQUE INDEX ux_endereco_principal ON enderecos_clientes(cliente_id) WHERE principal=1;
CREATE TABLE produtores (
 id INTEGER PRIMARY KEY, nome TEXT NOT NULL, documento TEXT UNIQUE, contato TEXT,
 municipio TEXT NOT NULL, uf TEXT NOT NULL CHECK(length(uf)=2), observacoes TEXT,
 ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0,1))
);
CREATE TABLE certificacoes_produtor (
 id INTEGER PRIMARY KEY, produtor_id INTEGER NOT NULL REFERENCES produtores(id), tipo TEXT NOT NULL,
 numero TEXT, orgao_emissor TEXT, emitida_em TEXT, valida_ate TEXT, arquivo_uri TEXT,
 status TEXT NOT NULL CHECK(status IN ('pendente','valida','expirada')), CHECK(valida_ate IS NULL OR emitida_em IS NULL OR valida_ate>=emitida_em)
);
CREATE TABLE categorias (
 id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE
);
CREATE TABLE produtos (
 id INTEGER PRIMARY KEY, sku TEXT NOT NULL UNIQUE, nome TEXT NOT NULL, descricao TEXT,
 categoria_id INTEGER NOT NULL REFERENCES categorias(id), unidade TEXT NOT NULL CHECK(unidade IN ('un','kg','g','l','pote','garrafa')),
 preco_varejo_centavos INTEGER NOT NULL CHECK(preco_varejo_centavos>=0), estoque_minimo_milesimos INTEGER NOT NULL DEFAULT 0 CHECK(estoque_minimo_milesimos>=0),
 refrigerado INTEGER NOT NULL DEFAULT 0 CHECK(refrigerado IN (0,1)), instrucao_embalagem TEXT,
 perecivel INTEGER NOT NULL DEFAULT 1 CHECK(perecivel IN (0,1)), ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0,1))
);
CREATE TABLE produtos_produtores (
 id INTEGER PRIMARY KEY, produto_id INTEGER NOT NULL REFERENCES produtos(id), produtor_id INTEGER NOT NULL REFERENCES produtores(id),
 capacidade_mensal_milesimos INTEGER NOT NULL CHECK(capacidade_mensal_milesimos>=0), custo_referencia_centavos INTEGER NOT NULL CHECK(custo_referencia_centavos>=0),
 prazo_producao_dias INTEGER NOT NULL DEFAULT 0 CHECK(prazo_producao_dias>=0), UNIQUE(produto_id,produtor_id)
);
CREATE TABLE precos_comerciais (
 id INTEGER PRIMARY KEY, tabela_id INTEGER NOT NULL REFERENCES tabelas_comerciais(id), produto_id INTEGER NOT NULL REFERENCES produtos(id),
 quantidade_minima_milesimos INTEGER NOT NULL DEFAULT 1000 CHECK(quantidade_minima_milesimos>0), preco_centavos INTEGER NOT NULL CHECK(preco_centavos>=0),
 UNIQUE(tabela_id,produto_id,quantidade_minima_milesimos)
);
CREATE TABLE ordens_compra (
 id INTEGER PRIMARY KEY, numero TEXT NOT NULL UNIQUE, produtor_id INTEGER NOT NULL REFERENCES produtores(id),
 status TEXT NOT NULL CHECK(status IN ('rascunho','emitida','parcial','recebida','cancelada')), emitida_em TEXT NOT NULL,
 prevista_em TEXT NOT NULL, responsavel_id INTEGER REFERENCES usuarios(id), observacoes TEXT, CHECK(prevista_em>=emitida_em)
);
CREATE TABLE itens_compra (
 id INTEGER PRIMARY KEY, ordem_compra_id INTEGER NOT NULL REFERENCES ordens_compra(id), produto_id INTEGER NOT NULL REFERENCES produtos(id),
 quantidade_milesimos INTEGER NOT NULL CHECK(quantidade_milesimos>0), custo_unitario_centavos INTEGER NOT NULL CHECK(custo_unitario_centavos>=0),
 peso_esperado_gramas INTEGER CHECK(peso_esperado_gramas>0)
);
CREATE TABLE recebimentos_compra (
 id INTEGER PRIMARY KEY, ordem_compra_id INTEGER NOT NULL REFERENCES ordens_compra(id), recebido_em TEXT NOT NULL,
 conferente_id INTEGER REFERENCES usuarios(id), documento_referencia TEXT, observacoes TEXT
);
CREATE TABLE lotes (
 id INTEGER PRIMARY KEY, produto_id INTEGER NOT NULL REFERENCES produtos(id), produtor_id INTEGER NOT NULL REFERENCES produtores(id),
 codigo TEXT NOT NULL, fabricado_em TEXT NOT NULL, validade_em TEXT NOT NULL, recebido_em TEXT NOT NULL,
 localizacao TEXT NOT NULL, custo_unitario_centavos INTEGER NOT NULL CHECK(custo_unitario_centavos>=0),
 saldo_milesimos INTEGER NOT NULL DEFAULT 0 CHECK(saldo_milesimos>=0), refrigerado INTEGER NOT NULL CHECK(refrigerado IN (0,1)),
 UNIQUE(produto_id,produtor_id,codigo), CHECK(validade_em>=fabricado_em), CHECK(recebido_em>=fabricado_em)
);
CREATE TABLE itens_recebimento (
 id INTEGER PRIMARY KEY, recebimento_id INTEGER NOT NULL REFERENCES recebimentos_compra(id), item_compra_id INTEGER NOT NULL REFERENCES itens_compra(id),
 lote_id INTEGER NOT NULL REFERENCES lotes(id), quantidade_milesimos INTEGER NOT NULL CHECK(quantidade_milesimos>0),
 peso_aferido_gramas INTEGER CHECK(peso_aferido_gramas>0), divergencia_justificativa TEXT
);
CREATE TABLE pedidos (
 id INTEGER PRIMARY KEY, numero TEXT NOT NULL UNIQUE, chave_idempotencia TEXT NOT NULL UNIQUE,
 cliente_id INTEGER NOT NULL REFERENCES clientes(id), canal_id INTEGER NOT NULL REFERENCES canais(id),
 tipo TEXT NOT NULL CHECK(tipo IN ('padrao','personalizado')), status TEXT NOT NULL CHECK(status IN ('novo','analise','separacao','pronto','concluido','cancelado')),
 criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, entrega_prevista_em TEXT NOT NULL, concluido_em TEXT,
 condicao_pagamento TEXT NOT NULL CHECK(condicao_pagamento IN ('avista','prazo')), vencimento_em TEXT,
 aprovador_credito_id INTEGER REFERENCES usuarios(id), responsavel_id INTEGER REFERENCES usuarios(id),
 endereco_entrega_snapshot TEXT, tabela_nome_snapshot TEXT, frete_centavos INTEGER NOT NULL DEFAULT 0 CHECK(frete_centavos>=0),
 desconto_centavos INTEGER NOT NULL DEFAULT 0 CHECK(desconto_centavos>=0), personalizacao_centavos INTEGER NOT NULL DEFAULT 0 CHECK(personalizacao_centavos>=0),
 total_centavos INTEGER NOT NULL CHECK(total_centavos>=0), observacoes TEXT,
 CHECK(condicao_pagamento<>'prazo' OR vencimento_em IS NOT NULL), CHECK(status<>'concluido' OR concluido_em IS NOT NULL)
);
CREATE TABLE itens_pedido (
 id INTEGER PRIMARY KEY, pedido_id INTEGER NOT NULL REFERENCES pedidos(id), produto_id INTEGER NOT NULL REFERENCES produtos(id),
 nome_snapshot TEXT NOT NULL, unidade_snapshot TEXT NOT NULL, quantidade_milesimos INTEGER NOT NULL CHECK(quantidade_milesimos>0),
 preco_unitario_centavos INTEGER NOT NULL CHECK(preco_unitario_centavos>=0), desconto_centavos INTEGER NOT NULL DEFAULT 0 CHECK(desconto_centavos>=0),
 subtotal_centavos INTEGER NOT NULL CHECK(subtotal_centavos>=0), observacoes TEXT
);
CREATE TABLE personalizados (
 id INTEGER PRIMARY KEY, pedido_id INTEGER NOT NULL UNIQUE REFERENCES pedidos(id), descricao TEXT NOT NULL, ocasiao TEXT,
 instrucao_embalagem TEXT, texto_cartao TEXT, referencia_uri TEXT
);
CREATE TABLE orcamentos_personalizados (
 id INTEGER PRIMARY KEY, personalizado_id INTEGER NOT NULL REFERENCES personalizados(id), revisao INTEGER NOT NULL CHECK(revisao>0),
 valor_centavos INTEGER NOT NULL CHECK(valor_centavos>=0), detalhes TEXT NOT NULL, valido_ate TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('rascunho','enviado','aprovado','recusado','substituido')), criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 aprovado_em TEXT, evidencia_aprovacao TEXT, UNIQUE(personalizado_id,revisao),
 CHECK(status<>'aprovado' OR (aprovado_em IS NOT NULL AND evidencia_aprovacao IS NOT NULL))
);
CREATE TABLE historico_pedidos (
 id INTEGER PRIMARY KEY, pedido_id INTEGER NOT NULL REFERENCES pedidos(id), status_anterior TEXT,
 status_novo TEXT NOT NULL, alterado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, usuario_id INTEGER REFERENCES usuarios(id), comentario TEXT
);
CREATE TABLE alocacoes_lotes (
 id INTEGER PRIMARY KEY, item_pedido_id INTEGER NOT NULL REFERENCES itens_pedido(id), lote_id INTEGER NOT NULL REFERENCES lotes(id),
 quantidade_milesimos INTEGER NOT NULL CHECK(quantidade_milesimos>0), custo_unitario_snapshot_centavos INTEGER NOT NULL CHECK(custo_unitario_snapshot_centavos>=0),
 status TEXT NOT NULL CHECK(status IN ('reservada','baixada','estornada')), UNIQUE(item_pedido_id,lote_id)
);
CREATE TABLE movimentos_estoque (
 id INTEGER PRIMARY KEY, chave_idempotencia TEXT NOT NULL UNIQUE, lote_id INTEGER NOT NULL REFERENCES lotes(id),
 tipo TEXT NOT NULL CHECK(tipo IN ('entrada','venda','perda','ajuste_entrada','ajuste_saida','estorno')),
 quantidade_milesimos INTEGER NOT NULL CHECK(quantidade_milesimos>0), item_pedido_id INTEGER REFERENCES itens_pedido(id),
 item_recebimento_id INTEGER REFERENCES itens_recebimento(id), movimento_origem_id INTEGER REFERENCES movimentos_estoque(id),
 motivo TEXT, usuario_id INTEGER REFERENCES usuarios(id), criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(tipo NOT IN ('perda','ajuste_entrada','ajuste_saida','estorno') OR motivo IS NOT NULL),
 CHECK(tipo<>'venda' OR item_pedido_id IS NOT NULL), CHECK(tipo<>'estorno' OR movimento_origem_id IS NOT NULL)
);
CREATE TABLE expedicoes (
 id INTEGER PRIMARY KEY, pedido_id INTEGER NOT NULL UNIQUE REFERENCES pedidos(id), status TEXT NOT NULL CHECK(status IN ('pendente','separando','embalado','enviado','entregue')),
 responsavel_id INTEGER REFERENCES usuarios(id), embalagem_termica INTEGER NOT NULL DEFAULT 0 CHECK(embalagem_termica IN (0,1)),
 protecao_garrafas INTEGER NOT NULL DEFAULT 0 CHECK(protecao_garrafas IN (0,1)), transportadora TEXT, rastreio TEXT,
 enviado_em TEXT, entregue_em TEXT, observacoes TEXT
);
CREATE TABLE contas_receber (
 id INTEGER PRIMARY KEY, pedido_id INTEGER NOT NULL UNIQUE REFERENCES pedidos(id), valor_centavos INTEGER NOT NULL CHECK(valor_centavos>0),
 emitida_em TEXT NOT NULL, vencimento_em TEXT NOT NULL, cancelada_em TEXT, motivo_cancelamento TEXT,
 CHECK(cancelada_em IS NULL OR motivo_cancelamento IS NOT NULL)
);
CREATE TABLE pagamentos (
 id INTEGER PRIMARY KEY, conta_receber_id INTEGER NOT NULL REFERENCES contas_receber(id), chave_idempotencia TEXT NOT NULL UNIQUE,
 valor_centavos INTEGER NOT NULL CHECK(valor_centavos>0), recebido_em TEXT NOT NULL,
 meio TEXT NOT NULL CHECK(meio IN ('pix','dinheiro','cartao','transferencia')), referencia TEXT,
 usuario_id INTEGER REFERENCES usuarios(id), estornado_em TEXT, motivo_estorno TEXT,
 CHECK(estornado_em IS NULL OR motivo_estorno IS NOT NULL)
);
CREATE TABLE contas_pagar (
 id INTEGER PRIMARY KEY, ordem_compra_id INTEGER REFERENCES ordens_compra(id), produtor_id INTEGER REFERENCES produtores(id), descricao TEXT NOT NULL,
 categoria TEXT NOT NULL, valor_centavos INTEGER NOT NULL CHECK(valor_centavos>0), competencia_em TEXT NOT NULL, vencimento_em TEXT NOT NULL,
 cancelada_em TEXT, motivo_cancelamento TEXT
);
CREATE TABLE pagamentos_fornecedores (
 id INTEGER PRIMARY KEY, conta_pagar_id INTEGER NOT NULL REFERENCES contas_pagar(id), chave_idempotencia TEXT NOT NULL UNIQUE,
 valor_centavos INTEGER NOT NULL CHECK(valor_centavos>0), pago_em TEXT NOT NULL, meio TEXT NOT NULL,
 usuario_id INTEGER REFERENCES usuarios(id), estornado_em TEXT, motivo_estorno TEXT
);
CREATE TABLE auditoria (
 id INTEGER PRIMARY KEY, entidade TEXT NOT NULL, entidade_id TEXT NOT NULL, acao TEXT NOT NULL,
 usuario_id INTEGER REFERENCES usuarios(id), instante_utc TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, detalhes TEXT
);
CREATE INDEX ix_pedidos_status_entrega ON pedidos(status,entrega_prevista_em);
CREATE INDEX ix_pedidos_cliente ON pedidos(cliente_id,criado_em);
CREATE INDEX ix_lotes_fefo ON lotes(produto_id,validade_em,recebido_em);
CREATE INDEX ix_movimentos_lote ON movimentos_estoque(lote_id,criado_em);
CREATE INDEX ix_receber_vencimento ON contas_receber(vencimento_em) WHERE cancelada_em IS NULL;
CREATE INDEX ix_pagamentos_conta ON pagamentos(conta_receber_id);
CREATE INDEX ix_historico_pedido ON historico_pedidos(pedido_id,alterado_em);
CREATE VIEW vw_contas_receber_saldos AS
 SELECT c.id,c.pedido_id,p.cliente_id,c.vencimento_em,c.valor_centavos,
 COALESCE(SUM(CASE WHEN pg.estornado_em IS NULL THEN pg.valor_centavos ELSE 0 END),0) AS recebido_centavos,
 c.valor_centavos-COALESCE(SUM(CASE WHEN pg.estornado_em IS NULL THEN pg.valor_centavos ELSE 0 END),0) AS saldo_centavos
 FROM contas_receber c JOIN pedidos p ON p.id=c.pedido_id LEFT JOIN pagamentos pg ON pg.conta_receber_id=c.id
 WHERE c.cancelada_em IS NULL GROUP BY c.id;
CREATE TRIGGER impedir_recebimento_excedente BEFORE INSERT ON pagamentos
BEGIN
 SELECT CASE WHEN (SELECT cancelada_em FROM contas_receber WHERE id=NEW.conta_receber_id) IS NOT NULL
 THEN RAISE(ABORT,'Conta cancelada') END;
 SELECT CASE WHEN NEW.valor_centavos > (SELECT valor_centavos FROM contas_receber WHERE id=NEW.conta_receber_id)-
 COALESCE((SELECT SUM(valor_centavos) FROM pagamentos WHERE conta_receber_id=NEW.conta_receber_id AND estornado_em IS NULL),0)
 THEN RAISE(ABORT,'Recebimento superior ao saldo') END;
END;
-- Estornos e alterações de valores exigem serviço transacional e auditoria; não editar lançamentos diretamente.
INSERT INTO canais(id,nome) VALUES(1,'WhatsApp'),(2,'Instagram'),(3,'Formulário'),(4,'Presencial');
INSERT INTO categorias(id,nome) VALUES(1,'Queijos'),(2,'Doces'),(3,'Destilados'),(4,'Embutidos');
COMMIT;

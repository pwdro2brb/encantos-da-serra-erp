"""Valida o DDL em memória e gera dicionário de todas as colunas."""
import pathlib, sqlite3, json
ROOT=pathlib.Path(__file__).resolve().parent.parent
db=sqlite3.connect(':memory:')
db.executescript((ROOT/'database/schema.sql').read_text(encoding='utf-8'))
assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
tables=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
descriptions={
 'usuarios':'Operadores internos e perfil de acesso. Autenticação deve integrar um provedor de identidade.',
 'canais':'Origem do contato: WhatsApp, Instagram, formulário e presencial.',
 'clientes':'Cadastro B2C/B2B, contato, preferências e política de crédito.',
 'enderecos_clientes':'Endereços reutilizáveis do cliente. O pedido conserva uma cópia da entrega.',
 'tabelas_comerciais':'Políticas comerciais por perfil e mínimos para atacado.',
 'produtores':'Famílias produtoras e localização de origem.',
 'certificacoes_produtor':'Certificações, evidências e datas de validade.',
 'categorias':'Agrupamento dos produtos.',
 'produtos':'Catálogo, unidade de medida, preço, conservação e embalagem.',
 'produtos_produtores':'Relação de fornecimento com custo, capacidade mensal e prazo por produto.',
 'precos_comerciais':'Faixas de preço por produto e tabela comercial.',
 'ordens_compra':'Pedido de suprimento ao produtor.',
 'itens_compra':'Produtos, quantidades negociadas e peso esperado.',
 'recebimentos_compra':'Cada conferência de uma ordem de compra, permitindo entregas parciais.',
 'itens_recebimento':'Liga o item comprado ao lote recebido e ao peso aferido.',
 'lotes':'Origem, fabricação, validade, localização, custo e saldo físico.',
 'pedidos':'Ticket comercial, cliente, canal, etapa, prazo e totais acordados.',
 'itens_pedido':'Produtos e preços históricos da venda.',
 'personalizados':'Detalhes específicos de cestas, kits e presentes.',
 'orcamentos_personalizados':'Revisões do orçamento e prova de aprovação do cliente.',
 'historico_pedidos':'Transições de etapa com operador e instante.',
 'alocacoes_lotes':'Rastreabilidade entre itens vendidos e lotes separados.',
 'movimentos_estoque':'Livro de entradas, vendas, perdas, ajustes e estornos.',
 'expedicoes':'Separação, embalagem, envio e entrega do pedido.',
 'contas_receber':'Título da venda. Saldo deriva dos pagamentos válidos.',
 'pagamentos':'Recebimentos parciais ou totais com chave de idempotência.',
 'contas_pagar':'Obrigações de compras e despesas para evolução do financeiro.',
 'pagamentos_fornecedores':'Liquidação parcial ou total de obrigações.',
 'auditoria':'Registro técnico das alterações relevantes.'
}
out=['# Dicionário de dados - Encantos da Serra','',f'Proposta inicial: **{len(tables)} tabelas**. Gerado diretamente do DDL validado em SQLite 3. O protótipo web usa localStorage e não se conecta a este modelo.','',
 '## Convenções','',
 '- `id`: chave primária inteira. `*_id`: chave estrangeira quando indicada.',
 '- `*_centavos`: inteiro monetário em BRL, sem ponto flutuante. R$ 48,00 = 4800.',
 '- `*_milesimos`: milésimos da unidade do produto. 2 unidades = 2000; 1,250 kg = 1250.',
 '- Datas de negócio: `AAAA-MM-DD`, na zona America/Sao_Paulo. Instantes: ISO 8601 em UTC.',
 '- Flags: 0 = não; 1 = sim. Inativar cadastros preserva o histórico.',
 '- Contatos e documentos reais exigem política de acesso e retenção antes da produção.',
 '- Valores de enumeração, limites, unicidade e checks completos constam em `schema.sql`.',
 '- SQLite aceita tipagem dinâmica: a API de produção deve validar tipos, datas, documentos e escalas.',
 '']
for t in tables:
    out += [f'## {t}','',descriptions[t],'','| Coluna | Tipo | Obrigatória | Relação / padrão |','| --- | --- | --- | --- |']
    fks={r[3]:f'{r[2]}.{r[4]}' for r in db.execute(f'PRAGMA foreign_key_list("{t}")')}
    for _,name,typ,notnull,default,pk in db.execute(f'PRAGMA table_info("{t}")'):
        rel='PK' if pk else fks.get(name,'')
        if default is not None: rel+=(' · ' if rel else '')+'padrão: '+str(default)
        out.append(f'| `{name}` | {typ} | {"Sim" if notnull or pk else "Não"} | {rel or "-"} |')
    out.append('')
out += ['## Regras transacionais a implementar na API','',
 '1. Concluir pedido em uma transação: validar etapa, aprovação do orçamento, crédito e prazo; bloquear concorrência de estoque; selecionar lotes FEFO elegíveis; inserir alocações e movimentos; reduzir saldos; criar título financeiro; registrar recebimento apenas se confirmado; salvar histórico e auditoria. Commit somente após todas as etapas.',
 '2. Reutilizar a chave de idempotência na repetição de uma requisição. `numero` do pedido, título por pedido e chaves de movimentos e pagamentos têm unicidade.',
 '3. Revalidar saldo e elegibilidade dos lotes na confirmação. A proposta não reserva estoque automaticamente no recebimento do formulário. Duas sessões concorrentes precisam de serialização no servidor.',
 '4. FEFO: menor `validade_em`, desempate por `recebido_em`. Bloquear online com validade menor ou igual a data de negócio + 7 dias. Alertar com até 15 dias.',
 '5. Snapshot dos preços e custos conserva o histórico. Calcular subtotal a partir da quantidade escalada e arredondar em centavos de forma explícita. Total = itens + frete + personalização - desconto.',
 '6. Aplicar mínimos B2B antes de liberar a tabela. Definir se os mínimos de valor e quantidade são cumulativos e se quantidades de unidades diferentes podem ser somadas.',
 '7. Para fiado, consultar autorização, limite disponível e aprovador. A demonstração apenas exige vencimento e não aplica política de crédito.',
 '8. Recebimento: comparar peso esperado e aferido e aceitar variação absoluta de até 5%, conforme RN03. Fora da tolerância, exigir decisão do conferente e justificativa.',
 '9. Conferir que lote, produto do item, produtor e ordem de compra pertencem à mesma cadeia. Chaves estrangeiras individuais não garantem essas combinações.',
 '10. Movimentos devem ser imutáveis. Corrigir por lançamento de estorno auditado. O saldo em `lotes` é um resumo mantido na mesma transação e conciliado com o livro de movimentos.',
 '11. O trigger de recebimentos cobre inserções. Updates, estornos, contas canceladas e pagamentos a fornecedores também exigem serviço transacional com validação de saldo. Restringir escrita direta.',
 '12. DRE, margem por produtor e curva ABC requerem critérios de competência, custo, perdas, despesas e rateios. O modelo prepara dados, mas os relatórios ainda precisam de definição e implementação.',
 '', '## Decisões em aberto','',
 '- CPF/CNPJ obrigatório em qual momento do atendimento?',
 '- Produtos não perecíveis terão validade obrigatória ou exceção formal?',
 '- Fiado permitirá parcelamento? O modelo inicial prevê um vencimento por pedido.',
 '- Quem aprova personalização, crédito, perdas e estornos?',
 '- Concluir corresponde à entrega efetiva ou à expedição? A demo assume entrega confirmada.',
 '- Qual identidade e estratégia de autorização serão usadas no backend?',
 '- SQLite serve para validar o modelo. A seleção do banco de produção depende da arquitetura e da concorrência esperada.',
 '']
(ROOT/'docs/DICIONARIO_DE_DADOS.md').write_text('\n'.join(out),encoding='utf-8')
# Pequeno cenário de integridade financeira; sem dados pessoais reais.
db.execute("INSERT INTO clientes(id,tipo,nome,telefone,canal_origem_id) VALUES(1,'B2C','Cliente de teste','EXEMPLO',1)")
db.execute("INSERT INTO pedidos(id,numero,chave_idempotencia,cliente_id,canal_id,tipo,status,entrega_prevista_em,condicao_pagamento,vencimento_em,total_centavos) VALUES(1,'TESTE-1','teste1',1,1,'padrao','novo','2026-11-05','prazo','2026-11-10',10000)")
db.execute("INSERT INTO contas_receber(id,pedido_id,valor_centavos,emitida_em,vencimento_em) VALUES(1,1,10000,'2026-11-03','2026-11-10')")
db.execute("INSERT INTO pagamentos(conta_receber_id,chave_idempotencia,valor_centavos,recebido_em,meio) VALUES(1,'pg1',4000,'2026-11-03','pix')")
assert db.execute('SELECT saldo_centavos FROM vw_contas_receber_saldos').fetchone()[0]==6000
try:
    db.execute("INSERT INTO pagamentos(conta_receber_id,chave_idempotencia,valor_centavos,recebido_em,meio) VALUES(1,'pg2',7000,'2026-11-03','pix')")
    raise AssertionError('O pagamento excedente deveria falhar')
except sqlite3.IntegrityError: pass
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
print(json.dumps({'tabelas':len(tables),'integridade':'ok','teste_saldo':'ok','teste_pagamento_excedente':'ok'},ensure_ascii=False))

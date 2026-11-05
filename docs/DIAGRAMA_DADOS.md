# Diagrama de dados

As entidades abaixo correspondem ao DDL em `database/schema.sql`. Consulte o dicionário para todas as colunas. O desenho agrupa as relações principais para facilitar a discussão.

```mermaid
erDiagram
    canais ||--o{ clientes : origem
    canais ||--o{ pedidos : entrada
    tabelas_comerciais ||--o{ clientes : orienta
    clientes ||--o{ enderecos_clientes : possui
    clientes ||--o{ pedidos : solicita
    tabelas_comerciais ||--o{ precos_comerciais : define
    produtos ||--o{ precos_comerciais : recebe
    categorias ||--o{ produtos : agrupa
    produtores ||--o{ produtos_produtores : fornece
    produtos ||--o{ produtos_produtores : origem
    produtores ||--o{ certificacoes_produtor : comprova
    pedidos ||--|{ itens_pedido : contem
    produtos ||--o{ itens_pedido : vendido
    pedidos ||--o| personalizados : detalha
    personalizados ||--o{ orcamentos_personalizados : revisoes
    pedidos ||--o{ historico_pedidos : registra
    pedidos ||--o| expedicoes : expede
    produtos ||--o{ lotes : rastreia
    produtores ||--o{ lotes : produz
    itens_pedido ||--o{ alocacoes_lotes : separa
    lotes ||--o{ alocacoes_lotes : atende
    lotes ||--o{ movimentos_estoque : movimenta
    itens_pedido ||--o{ movimentos_estoque : baixa
    pedidos ||--o| contas_receber : gera
    contas_receber ||--o{ pagamentos : recebe
```

```mermaid
erDiagram
    produtores ||--o{ ordens_compra : recebe
    ordens_compra ||--|{ itens_compra : contem
    produtos ||--o{ itens_compra : comprado
    ordens_compra ||--o{ recebimentos_compra : entregas
    recebimentos_compra ||--|{ itens_recebimento : confere
    itens_compra ||--o{ itens_recebimento : recebido
    lotes ||--o{ itens_recebimento : identifica
    itens_recebimento ||--o{ movimentos_estoque : entrada
    ordens_compra o|--o{ contas_pagar : origina
    produtores o|--o{ contas_pagar : credor
    contas_pagar ||--o{ pagamentos_fornecedores : liquida
    usuarios o|--o{ historico_pedidos : altera
    usuarios o|--o{ movimentos_estoque : opera
    usuarios o|--o{ pagamentos : registra
    usuarios o|--o{ auditoria : registra
```

Uma relação 1:N obrigatória no desenho expressa a regra de negócio, como pedido com pelo menos um item. Essa quantidade mínima deve ser validada pela API; uma chave estrangeira sozinha não impede um cabeçalho sem itens.

As relações opcionais representam cadastros ou lançamentos que ainda não existem em uma etapa. A tabela de auditoria referencia a entidade por nome e identificador, não por chave estrangeira para cada tabela.

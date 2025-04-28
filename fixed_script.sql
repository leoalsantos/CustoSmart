-- This is a simplified version of the script with only tables relevant to CustoSmart
-- It excludes the PostgreSQL system tables that were causing errors

-- Application-specific tables

CREATE TABLE tipo_produto (
        tipo_produto_id BIGSERIAL NOT NULL,
        versao INT4 NOT NULL,
        descricao VARCHAR(40) NOT NULL,
        PRIMARY KEY(tipo_produto_id)
);

CREATE TABLE categoria_produto (
        categoria_produto_id BIGSERIAL NOT NULL,
        versao INT4 NOT NULL,
        descricao VARCHAR(40) NOT NULL,
        PRIMARY KEY(categoria_produto_id)
);

CREATE TABLE unidade_medida (
        unidade_medida_id BIGSERIAL NOT NULL,
        versao INT4 NOT NULL,
        descricao VARCHAR(255),
        sigla VARCHAR(255),
        PRIMARY KEY(unidade_medida_id)
);

CREATE TABLE produto (
        produto_id BIGSERIAL NOT NULL,
        versao INT4 NOT NULL,
        caracteristicas VARCHAR(100),
        codigo VARCHAR(20) NOT NULL,
        codigo_barras INT4,
        consumo_aquisicao FLOAT8,
        consumo_medio FLOAT8,
        descricao VARCHAR(100),
        estoque_maximo FLOAT8,
        estoque_minimo FLOAT8,
        nome VARCHAR(40) NOT NULL,
        ponto_pedido FLOAT8,
        preco_compra FLOAT8,
        preco_custo FLOAT8,
        preco_medio FLOAT8,
        preco_venda FLOAT8,
        procedimentos_recebimento VARCHAR(255),
        utilizacao_produto VARCHAR(255),
        categoria_produto_id INT8 NOT NULL,
        tipo_produto_id INT8 NOT NULL,
        unidade_medida_id INT8 NOT NULL,
        PRIMARY KEY(produto_id),
        FOREIGN KEY (categoria_produto_id) REFERENCES categoria_produto(categoria_produto_id),
        FOREIGN KEY (tipo_produto_id) REFERENCES tipo_produto(tipo_produto_id),
        FOREIGN KEY (unidade_medida_id) REFERENCES unidade_medida(unidade_medida_id)
);

CREATE TABLE produto_obsevarcoes (
        produto_produto_id INT8 NOT NULL,
        obsevarcoes VARCHAR(255),
        FOREIGN KEY (produto_produto_id) REFERENCES produto(produto_id)
);

CREATE TABLE fornecedor (
        fornecedor_id BIGSERIAL NOT NULL,
        versao INT4 NOT NULL,
        cnpj VARCHAR(255) NOT NULL,
        codigo VARCHAR(20) NOT NULL,
        contato VARCHAR(255),
        email VARCHAR(255),
        bairro VARCHAR(255),
        cep VARCHAR(255),
        cidade VARCHAR(255),
        complemento VARCHAR(255),
        estado VARCHAR(255),
        logradouro VARCHAR(255),
        numero VARCHAR(255),
        inscricaoestadual VARCHAR(255),
        inscricaomunicipal VARCHAR(255),
        nome VARCHAR(40) NOT NULL,
        razaosocial VARCHAR(255),
        tipopagamento VARCHAR(255),
        PRIMARY KEY(fornecedor_id)
);

CREATE TABLE fornecedor_obsevarcoes (
        fornecedor_fornecedor_id INT8 NOT NULL,
        obsevarcoes VARCHAR(255),
        FOREIGN KEY (fornecedor_fornecedor_id) REFERENCES fornecedor(fornecedor_id)
);

CREATE TABLE telefone (
        id BIGSERIAL NOT NULL,
        versao INT4 NOT NULL,
        numero VARCHAR(12),
        tipotelefone VARCHAR(255),
        cliente_id INT8,
        fornecedor_id INT8,
        PRIMARY KEY(id),
        FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(fornecedor_id)
);

CREATE TABLE condicaopagamento (
        id BIGSERIAL NOT NULL,
        versao INT4 NOT NULL,
        descricao VARCHAR(255),
        prazo INT4 NOT NULL,
        condicaopagamento_fornecedor_id INT8,
        PRIMARY KEY(id),
        FOREIGN KEY (condicaopagamento_fornecedor_id) REFERENCES fornecedor(fornecedor_id)
);

CREATE TABLE cliente (
        cliente_id BIGSERIAL NOT NULL,
        versao INT4 NOT NULL,
        email VARCHAR(255),
        nome VARCHAR(40) NOT NULL,
        codigo VARCHAR(255) NOT NULL,
        cpf VARCHAR(255) NOT NULL,
        bairro VARCHAR(255),
        cep VARCHAR(255),
        cidade VARCHAR(255),
        complemento VARCHAR(255),
        estado VARCHAR(255),
        logradouro VARCHAR(255),
        numero VARCHAR(255),
        PRIMARY KEY(cliente_id)
);

CREATE TABLE member (
        id INT8 NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(25) NOT NULL,
        phone_number VARCHAR(12) NOT NULL,
        PRIMARY KEY(id)
);

-- Add indexes for better performance
CREATE INDEX idx_produto_categoria ON produto(categoria_produto_id);
CREATE INDEX idx_produto_tipo ON produto(tipo_produto_id);
CREATE INDEX idx_produto_unidade ON produto(unidade_medida_id);
CREATE INDEX idx_fornecedor_nome ON fornecedor(nome);
CREATE INDEX idx_cliente_nome ON cliente(nome);
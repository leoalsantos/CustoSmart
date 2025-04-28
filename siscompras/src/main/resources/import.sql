--
-- JBoss, Home of Professional Open Source
-- Copyright 2013, Red Hat, Inc. and/or its affiliates, and individual
-- contributors by the @authors tag. See the copyright.txt in the
-- distribution for a full listing of individual contributors.
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
-- http://www.apache.org/licenses/LICENSE-2.0
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.
--

-- You can use this file to load seed data into the database using SQL statements
insert into Member (id, name, email, phone_number) values (0, 'John Smith', 'john.smith@mailinator.com', '2125551212') 

INSERT INTO "public"."categoria_produto" (categoria_produto_id,versao,descricao) VALUES (1, 1,'BEBIDAS')
INSERT INTO "public"."categoria_produto" (categoria_produto_id,versao,descricao) VALUES (2, 1,'SANDUICHES')

INSERT INTO "public"."tipo_produto" (tipo_produto_id,versao,descricao) VALUES (1 /*not nullable*/,1 /*not nullable*/,'VENDA' /*not nullable*/);
INSERT INTO "public"."tipo_produto" (tipo_produto_id,versao,descricao) VALUES (2 /*not nullable*/,1 /*not nullable*/,'COMPRA' /*not nullable*/);

INSERT INTO "public"."unidade_medida" (unidade_medida_id,versao,abreviacao,descricao) VALUES (1 /*not nullable*/,1 /*not nullable*/,'UN' /*not nullable*/,'UNIDADE' /*not nullable*/);
INSERT INTO "public"."unidade_medida" (unidade_medida_id,versao,abreviacao,descricao) VALUES (2 /*not nullable*/,1 /*not nullable*/,'CX' /*not nullable*/,'CAIXA' /*not nullable*/);

INSERT INTO "public"."produto" (produto_id,versao,caracteristicas,codigo,codigo_barras,consumo_aquisicao,consumo_medio,descricao,estoque_maximo,estoque_minimo,nome,ponto_pedido,preco_compra,preco_custo,preco_medio,preco_venda,procedimentos_recebimento,utilizacao_produto,categoria_produto_id,tipo_produto_id,unidade_medida_id) VALUES (1 /*not nullable*/,1 /*not nullable*/,'CARACTERISTICA','CODIGO' /*not nullable*/,101011,10,15,'DESCRICAO PRODUTO',50,10,'NOME' /*not nullable*/,10,1.50,1.75,1.60,2.50,'PROCEDIMENTOS RECEBIMENTO','UTILIZACAO PRODUTO',1 /*not nullable*/,1 /*not nullable*/,1 /*not nullable*/);
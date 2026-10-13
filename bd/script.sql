-- Script de Criação do Banco de Dados - Conecta-CEEP
-- Salvar em: bd/script.sql

-- 1. Tabela de Professores Autorizados (Coordenação gerencia)
CREATE TABLE IF NOT EXISTS autorizados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL
);

-- 2. Tabela de Usuários (Contas criadas pelos professores)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    papel VARCHAR(20) DEFAULT 'professor' -- 'professor' ou 'coordenacao'
);

-- 3. Tabela de Reservas de Espaços
CREATE TABLE IF NOT EXISTS reservas (
    id TEXT PRIMARY KEY,               -- ID gerado dinamicamente no formato único
    data VARCHAR(10) NOT NULL,          -- Formato: YYYY-MM-DD
    espaco VARCHAR(100) NOT NULL,
    horario VARCHAR(50) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    turma VARCHAR(100) NOT NULL,
    FOREIGN KEY (cpf) REFERENCES usuarios(cpf)
);

-- Carga inicial de Administradores / Coordenação
INSERT OR IGNORE INTO autorizados (cpf, nome) VALUES ('10754772985', 'Juliano');
INSERT OR IGNORE INTO autorizados (cpf, nome) VALUES ('09082967979', 'Pedro');
INSERT OR IGNORE INTO autorizados (cpf, nome) VALUES ('12616379929', 'Maria');
INSERT OR IGNORE INTO autorizados (cpf, nome) VALUES ('11144477735', 'Professor (teste)');

INSERT OR IGNORE INTO usuarios (cpf, nome, senha, papel) VALUES ('10754772985', 'Juliano', '123', 'coordenacao');
INSERT OR IGNORE INTO usuarios (cpf, nome, senha, papel) VALUES ('09082967979', 'Pedro', '321', 'coordenacao');
INSERT OR IGNORE INTO usuarios (cpf, nome, senha, papel) VALUES ('12616379929', 'Maria', '154', 'coordenacao');
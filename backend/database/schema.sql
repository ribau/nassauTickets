-- Estrutura inicial para MySQL 8.0. Aplicar em um banco vazio.
CREATE DATABASE IF NOT EXISTS nassau_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nassau_tickets;

CREATE TABLE IF NOT EXISTS atendentes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  login VARCHAR(80) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  gestor BOOLEAN NOT NULL DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS guiches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identificacao VARCHAR(30) NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Um único registro permite serializar a escolha do próximo atendimento.
CREATE TABLE IF NOT EXISTS controle_fila (
  id TINYINT UNSIGNED PRIMARY KEY,
  ultima_prioridade CHAR(2) NULL,
  ultima_nao_prioritaria CHAR(2) NULL,
  CONSTRAINT controle_fila_unico CHECK (id = 1)
);
INSERT IGNORE INTO controle_fila (id) VALUES (1);

CREATE TABLE IF NOT EXISTS sequencias_diarias (
  data_emissao DATE NOT NULL,
  tipo ENUM('SP','SE','SG') NOT NULL,
  ultimo_numero SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (data_emissao, tipo),
  CONSTRAINT limite_sequencia CHECK (ultimo_numero <= 999)
);

CREATE TABLE IF NOT EXISTS senhas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(12) NOT NULL,
  tipo ENUM('SP','SE','SG') NOT NULL,
  data_emissao DATE NOT NULL,
  sequencia SMALLINT UNSIGNED NOT NULL,
  estado ENUM('EMITIDA','AGUARDANDO','CHAMADA','CHAMADA_NOVAMENTE','EM_ATENDIMENTO','ATENDIDA','NAO_COMPARECEU','DESCARTADA') NOT NULL,
  emitida_em DATETIME(3) NOT NULL,
  atendente_id BIGINT UNSIGNED NULL,
  guiche_id BIGINT UNSIGNED NULL,
  primeira_chamada_em DATETIME(3) NULL,
  segunda_chamada_em DATETIME(3) NULL,
  inicio_em DATETIME(3) NULL,
  fim_em DATETIME(3) NULL,
  UNIQUE KEY numero_unico (numero),
  UNIQUE KEY sequencia_unica (data_emissao, tipo, sequencia),
  INDEX fila (data_emissao, estado, tipo, id),
  FOREIGN KEY (atendente_id) REFERENCES atendentes(id),
  FOREIGN KEY (guiche_id) REFERENCES guiches(id)
);

CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  senha_id BIGINT UNSIGNED NOT NULL,
  atendente_id BIGINT UNSIGNED NULL,
  guiche_id BIGINT UNSIGNED NULL,
  evento VARCHAR(40) NOT NULL,
  ocorrido_em DATETIME(3) NOT NULL,
  FOREIGN KEY (senha_id) REFERENCES senhas(id),
  FOREIGN KEY (atendente_id) REFERENCES atendentes(id),
  FOREIGN KEY (guiche_id) REFERENCES guiches(id),
  INDEX auditoria_senha (senha_id, ocorrido_em)
);

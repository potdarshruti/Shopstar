CREATE DATABASE IF NOT EXISTS store_ratings CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE store_ratings;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(60)  NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  address       VARCHAR(400) NOT NULL,
  role          ENUM('admin','user','owner') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stores (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  address    VARCHAR(400) NOT NULL,
  owner_id   INT UNSIGNED NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_store_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_stores_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ratings (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  store_id   INT UNSIGNED NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_rating_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_rating_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_store (user_id, store_id),
  INDEX idx_ratings_store (store_id)
) ENGINE=InnoDB;

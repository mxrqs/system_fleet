-- Migration 0005: tabela contracts + contractId em orders e checklists

CREATE TABLE IF NOT EXISTS `contracts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `code` varchar(64),
  `status` enum('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  `createdAt` timestamp NOT NULL DEFAULT NOW(),
  `updatedAt` timestamp NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

CREATE INDEX `contracts_status_idx` ON `contracts` (`status`);

ALTER TABLE `orders` ADD COLUMN `contractId` int AFTER `creatorName`;

ALTER TABLE `checklists` ADD COLUMN `contractId` int AFTER `id`;

CREATE TABLE `app_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `app_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `checklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int,
	`contrato` varchar(255) NOT NULL,
	`placa` varchar(60) NOT NULL,
	`km` varchar(60) NOT NULL,
	`inspetor` varchar(255) NOT NULL,
	`dataVistoria` timestamp NOT NULL,
	`luzes` enum('Bom','Ruim','Igual'),
	`freios` enum('Bom','Ruim','Igual'),
	`pneus` enum('Bom','Ruim','Igual'),
	`oleo` enum('Bom','Ruim','Igual'),
	`aguaRadiador` enum('Bom','Ruim','Igual'),
	`fotoKmUrl` text,
	`fotoFrenteUrl` text,
	`fotoTraseiraUrl` text,
	`fotoLateralDirUrl` text,
	`fotoLateralEsqUrl` text,
	`observacoes` text,
	`assinatura` text,
	`assinaturaType` enum('canvas','texto') DEFAULT 'texto',
	`assinaturaUrl` text,
	`osId` int,
	`osOrderNumber` varchar(32),
	`createdById` int NOT NULL,
	`createdByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(64),
	`status` enum('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP INDEX `inv_mov_orderId_idx` ON `inventory_movements`;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('Ativo','Inativo','Pendente','Concluído','Aprovada','Reprovada','Autorizada') NOT NULL DEFAULT 'Pendente';--> statement-breakpoint
ALTER TABLE `inventory_items` ADD `grupo` varchar(128);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `unitCost` decimal(12,2);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `totalCost` decimal(14,2);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `grupo` varchar(128);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `veiculo` varchar(60);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `ocOrderId` int;--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `ocOrderNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `ocNumber` varchar(64);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `osOrderId` int;--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `osOrderNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `movementDate` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `contractId` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `ocNumber` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `ocPdfUrl` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `rejectionReason` text;--> statement-breakpoint
CREATE INDEX `app_users_username_idx` ON `app_users` (`username`);--> statement-breakpoint
CREATE INDEX `checklists_placa_idx` ON `checklists` (`placa`);--> statement-breakpoint
CREATE INDEX `checklists_contrato_idx` ON `checklists` (`contrato`);--> statement-breakpoint
CREATE INDEX `checklists_inspetor_idx` ON `checklists` (`inspetor`);--> statement-breakpoint
CREATE INDEX `checklists_data_idx` ON `checklists` (`dataVistoria`);--> statement-breakpoint
CREATE INDEX `checklists_osId_idx` ON `checklists` (`osId`);--> statement-breakpoint
CREATE INDEX `contracts_status_idx` ON `contracts` (`status`);--> statement-breakpoint
CREATE INDEX `inv_mov_ocOrderId_idx` ON `inventory_movements` (`ocOrderId`);--> statement-breakpoint
CREATE INDEX `inv_mov_osOrderId_idx` ON `inventory_movements` (`osOrderId`);--> statement-breakpoint
CREATE INDEX `inv_mov_grupo_idx` ON `inventory_movements` (`grupo`);--> statement-breakpoint
ALTER TABLE `inventory_movements` DROP COLUMN `orderId`;--> statement-breakpoint
ALTER TABLE `inventory_movements` DROP COLUMN `orderNumber`;
CREATE TABLE `fleet_vehicle_contract_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`contractId` int NOT NULL,
	`mobilizationDate` timestamp NOT NULL,
	`demobilizationDate` timestamp,
	`notes` text,
	`changedById` int,
	`changedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fleet_vehicle_contract_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fleet_vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`type` varchar(50) NOT NULL DEFAULT 'veiculo',
	`matricula` varchar(50),
	`plate` varchar(20),
	`modelo` varchar(100) NOT NULL,
	`marca` varchar(100),
	`chassi` varchar(100),
	`renavam` varchar(50),
	`ano` int,
	`combustivel` varchar(50),
	`proprietario` varchar(255),
	`empresa` enum('GP','NP') NOT NULL DEFAULT 'GP',
	`status` enum('Ativo','Em manutenção','Devolvido','Vendido') NOT NULL DEFAULT 'Ativo',
	`crlvNumber` varchar(100),
	`crlvExpirationDate` timestamp,
	`tacografoNumber` varchar(100),
	`tacografoExpirationDate` timestamp,
	`artNumber` varchar(100),
	`artExpirationDate` timestamp,
	`currentContractId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fleet_vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_plan_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`orderId` int,
	`orderNumber` varchar(32),
	`executedKm` int,
	`executedHours` int,
	`executedDate` timestamp NOT NULL,
	`nextKm` int,
	`nextHours` int,
	`nextDate` timestamp,
	`notes` text,
	`executedById` int,
	`executedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maintenance_plan_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('Preventiva','Corretiva Programada','Inspeção','Documentação','Lubrificação','Troca','Outro') NOT NULL DEFAULT 'Preventiva',
	`status` enum('Em dia','Próximo','Vencido','Pausado','Inativo') NOT NULL DEFAULT 'Em dia',
	`priority` enum('Baixa','Média','Alta','Crítica') NOT NULL DEFAULT 'Média',
	`contractId` int,
	`contrato` varchar(255),
	`intervalKm` int,
	`intervalHours` int,
	`intervalDays` int,
	`currentKm` int,
	`currentHours` int,
	`lastKm` int,
	`lastHours` int,
	`lastDate` timestamp,
	`nextKm` int,
	`nextHours` int,
	`nextDate` timestamp,
	`advanceAlertKm` int DEFAULT 1000,
	`advanceAlertHours` int DEFAULT 50,
	`advanceAlertDays` int DEFAULT 15,
	`autoGenerateOs` enum('yes','no') NOT NULL DEFAULT 'no',
	`lastOrderId` int,
	`lastOrderNumber` varchar(32),
	`notes` text,
	`createdById` int,
	`createdByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_material_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`inventoryItemId` int,
	`itemName` varchar(255) NOT NULL,
	`quantityRequested` decimal(10,3) NOT NULL,
	`quantityDelivered` decimal(10,3) NOT NULL DEFAULT '0',
	`unit` varchar(50),
	`unitCost` decimal(12,2),
	`status` enum('Solicitado','Separado','Entregue','Cancelado') NOT NULL DEFAULT 'Solicitado',
	`notes` text,
	`requestedById` int NOT NULL,
	`requestedByName` varchar(255),
	`withdrawnByName` varchar(255),
	`deliveredById` int,
	`deliveredByName` varchar(255),
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `order_material_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('Cliente','Fornecedor') NOT NULL DEFAULT 'Fornecedor',
	`cnpj` varchar(20),
	`razaoSocial` varchar(255) NOT NULL,
	`nomeFantasia` varchar(255),
	`inscricaoEstadual` varchar(50),
	`inscricaoMunicipal` varchar(50),
	`situacao` varchar(100),
	`porte` varchar(100),
	`cep` varchar(20),
	`endereco` varchar(255),
	`numero` varchar(50),
	`complemento` varchar(255),
	`bairro` varchar(100),
	`municipio` varchar(100),
	`uf` varchar(2),
	`pais` varchar(100) DEFAULT 'BRASIL',
	`telefone` varchar(50),
	`email` varchar(255),
	`contato` varchar(255),
	`banco` varchar(100),
	`agencia` varchar(50),
	`conta` varchar(100),
	`tipoConta` varchar(50),
	`titular` varchar(255),
	`pix` varchar(255),
	`categoria` varchar(100),
	`observacoes` text,
	`status` enum('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inventory_items` DROP INDEX `inventory_items_barcode_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `app_users` MODIFY COLUMN `role` enum('user','admin','estoquista') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `inventory_items` MODIFY COLUMN `barcode` varchar(100);--> statement-breakpoint
ALTER TABLE `inventory_movements` MODIFY COLUMN `movementType` enum('compra','devolução','ajuste','uso em OS') NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('Ativo','Inativo','Pendente','Concluído','Aprovada','Reprovada','Autorizada','PendenteAprovacao','Reaberta') NOT NULL DEFAULT 'Pendente';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','estoquista') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp;--> statement-breakpoint
ALTER TABLE `contracts` ADD `empresa` enum('GP','NP') DEFAULT 'GP' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `vehicleId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
CREATE INDEX `fleet_hist_vehicle_idx` ON `fleet_vehicle_contract_history` (`vehicleId`);--> statement-breakpoint
CREATE INDEX `fleet_hist_contract_idx` ON `fleet_vehicle_contract_history` (`contractId`);--> statement-breakpoint
CREATE INDEX `fleet_hist_mobilization_idx` ON `fleet_vehicle_contract_history` (`mobilizationDate`);--> statement-breakpoint
CREATE INDEX `fleet_plate_idx` ON `fleet_vehicles` (`plate`);--> statement-breakpoint
CREATE INDEX `fleet_matricula_idx` ON `fleet_vehicles` (`matricula`);--> statement-breakpoint
CREATE INDEX `fleet_modelo_idx` ON `fleet_vehicles` (`modelo`);--> statement-breakpoint
CREATE INDEX `fleet_current_contract_idx` ON `fleet_vehicles` (`currentContractId`);--> statement-breakpoint
CREATE INDEX `fleet_status_idx` ON `fleet_vehicles` (`status`);--> statement-breakpoint
CREATE INDEX `maintenance_plan_exec_plan_idx` ON `maintenance_plan_executions` (`planId`);--> statement-breakpoint
CREATE INDEX `maintenance_plan_exec_vehicle_idx` ON `maintenance_plan_executions` (`vehicleId`);--> statement-breakpoint
CREATE INDEX `maintenance_plan_exec_order_idx` ON `maintenance_plan_executions` (`orderId`);--> statement-breakpoint
CREATE INDEX `maintenance_plan_exec_date_idx` ON `maintenance_plan_executions` (`executedDate`);--> statement-breakpoint
CREATE INDEX `maintenance_plans_vehicle_idx` ON `maintenance_plans` (`vehicleId`);--> statement-breakpoint
CREATE INDEX `maintenance_plans_contract_idx` ON `maintenance_plans` (`contractId`);--> statement-breakpoint
CREATE INDEX `maintenance_plans_status_idx` ON `maintenance_plans` (`status`);--> statement-breakpoint
CREATE INDEX `maintenance_plans_type_idx` ON `maintenance_plans` (`type`);--> statement-breakpoint
CREATE INDEX `maintenance_plans_nextDate_idx` ON `maintenance_plans` (`nextDate`);--> statement-breakpoint
CREATE INDEX `omr_order_idx` ON `order_material_requests` (`orderId`);--> statement-breakpoint
CREATE INDEX `omr_inventory_idx` ON `order_material_requests` (`inventoryItemId`);--> statement-breakpoint
CREATE INDEX `omr_status_idx` ON `order_material_requests` (`status`);--> statement-breakpoint
CREATE INDEX `suppliers_status_idx` ON `suppliers` (`status`);--> statement-breakpoint
CREATE INDEX `suppliers_cnpj_idx` ON `suppliers` (`cnpj`);--> statement-breakpoint
CREATE INDEX `suppliers_razaoSocial_idx` ON `suppliers` (`razaoSocial`);--> statement-breakpoint
CREATE INDEX `inventory_items_name_idx` ON `inventory_items` (`name`);--> statement-breakpoint
CREATE INDEX `inventory_items_barcode_idx` ON `inventory_items` (`barcode`);--> statement-breakpoint
CREATE INDEX `inventory_items_grupo_idx` ON `inventory_items` (`grupo`);--> statement-breakpoint
CREATE INDEX `orders_vehicleId_idx` ON `orders` (`vehicleId`);--> statement-breakpoint
CREATE INDEX `orders_contractId_idx` ON `orders` (`contractId`);--> statement-breakpoint
ALTER TABLE `contracts` DROP COLUMN `code`;
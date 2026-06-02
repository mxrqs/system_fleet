CREATE TABLE `inventory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`barcode` varchar(128),
	`unitCost` decimal(12,2) NOT NULL DEFAULT '0',
	`unit` varchar(32) NOT NULL DEFAULT 'un',
	`description` text,
	`currentQuantity` decimal(10,3) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_items_barcode_unique` UNIQUE(`barcode`)
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryItemId` int NOT NULL,
	`movementType` enum('compra','devolução','uso em OS') NOT NULL,
	`direction` enum('entrada','saída') NOT NULL,
	`quantity` decimal(10,3) NOT NULL,
	`reason` varchar(255) NOT NULL,
	`description` text,
	`orderId` int,
	`orderNumber` varchar(32),
	`performedById` int NOT NULL,
	`performedByName` varchar(255),
	`performedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`licensePlate` varchar(20) NOT NULL,
	`description` text NOT NULL,
	`resolved` enum('yes','no') NOT NULL DEFAULT 'no',
	`orderId` int,
	`orderNumber` varchar(32),
	`createdById` int NOT NULL,
	`createdByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `maintenance_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`inventoryItemId` int,
	`itemName` varchar(255) NOT NULL,
	`quantity` decimal(10,3) NOT NULL,
	`unitCost` decimal(12,2),
	`unit` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`type` enum('OC','OS') NOT NULL,
	`status` enum('Ativo','Inativo','Pendente','Concluído') NOT NULL DEFAULT 'Ativo',
	`title` varchar(255) NOT NULL,
	`description` text,
	`licensePlate` varchar(20),
	`creatorId` int NOT NULL,
	`creatorName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
CREATE INDEX `inv_mov_itemId_idx` ON `inventory_movements` (`inventoryItemId`);--> statement-breakpoint
CREATE INDEX `inv_mov_orderId_idx` ON `inventory_movements` (`orderId`);--> statement-breakpoint
CREATE INDEX `maint_alerts_plate_idx` ON `maintenance_alerts` (`licensePlate`);--> statement-breakpoint
CREATE INDEX `maint_alerts_resolved_idx` ON `maintenance_alerts` (`resolved`);--> statement-breakpoint
CREATE INDEX `order_items_orderId_idx` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `orders_creatorId_idx` ON `orders` (`creatorId`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);
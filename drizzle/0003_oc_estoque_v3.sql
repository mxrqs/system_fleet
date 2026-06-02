-- Migration 0003: Fluxo OC aprovação + Estoque reestruturado

-- 1. Alterar enum de status em orders para incluir Aprovada, Reprovada, Autorizada
ALTER TABLE `orders` MODIFY `status` enum('Ativo','Inativo','Pendente','Concluído','Aprovada','Reprovada','Autorizada') NOT NULL DEFAULT 'Pendente';--> statement-breakpoint

-- 2. Adicionar campos de autorização OC em orders
ALTER TABLE `orders` ADD `ocNumber` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `ocPdfUrl` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `rejectionReason` text;--> statement-breakpoint

-- 3. Adicionar campo grupo em inventory_items
ALTER TABLE `inventory_items` ADD `grupo` varchar(128);--> statement-breakpoint

-- 4. Adicionar novos campos em inventory_movements
ALTER TABLE `inventory_movements` ADD `unitCost` decimal(12,2);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `totalCost` decimal(14,2);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `grupo` varchar(128);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `veiculo` varchar(60);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `ocOrderId` int;--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `ocOrderNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `ocNumber` varchar(64);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `osOrderId` int;--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `osOrderNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `movementDate` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint

-- 5. Criar índices para os novos campos de inventory_movements
CREATE INDEX `inv_mov_ocOrderId_idx` ON `inventory_movements` (`ocOrderId`);--> statement-breakpoint
CREATE INDEX `inv_mov_osOrderId_idx` ON `inventory_movements` (`osOrderId`);--> statement-breakpoint
CREATE INDEX `inv_mov_grupo_idx` ON `inventory_movements` (`grupo`);

-- Migration 0004: Tabela Checklists de Vistoria de Veículo
CREATE TABLE `checklists` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `contrato` varchar(255) NOT NULL,
  `placa` varchar(60) NOT NULL,
  `km` varchar(60) NOT NULL,
  `inspetor` varchar(255) NOT NULL,
  `dataVistoria` timestamp NOT NULL,
  `luzes` enum('Sim','Não','Igual'),
  `freios` enum('Sim','Não','Igual'),
  `pneus` enum('Sim','Não','Igual'),
  `oleo` enum('Sim','Não','Igual'),
  `aguaRadiador` enum('Sim','Não','Igual'),
  `fotoKmUrl` text,
  `fotoFrenteUrl` text,
  `fotoTraseiraUrl` text,
  `fotoLateralDirUrl` text,
  `fotoLateralEsqUrl` text,
  `observacoes` text,
  `assinatura` text,
  `assinaturaType` enum('canvas','texto') DEFAULT 'texto',
  `osId` int,
  `osOrderNumber` varchar(32),
  `createdById` int NOT NULL,
  `createdByName` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `checklists_placa_idx` ON `checklists` (`placa`);
--> statement-breakpoint
CREATE INDEX `checklists_contrato_idx` ON `checklists` (`contrato`);
--> statement-breakpoint
CREATE INDEX `checklists_inspetor_idx` ON `checklists` (`inspetor`);
--> statement-breakpoint
CREATE INDEX `checklists_data_idx` ON `checklists` (`dataVistoria`);
--> statement-breakpoint
CREATE INDEX `checklists_osId_idx` ON `checklists` (`osId`);
--> statement-breakpoint
-- Adicionar checklistId em orders para rastrear qual checklist originou a OS
ALTER TABLE `orders` ADD `checklistId` int;
--> statement-breakpoint
CREATE INDEX `orders_checklistId_idx` ON `orders` (`checklistId`);

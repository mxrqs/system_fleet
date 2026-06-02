-- Migration: Change checklist check items from Sim/Não to Bom/Ruim
-- and add assinaturaUrl column

ALTER TABLE `checklists`
  MODIFY COLUMN `luzes` ENUM('Bom','Ruim','Igual'),
  MODIFY COLUMN `freios` ENUM('Bom','Ruim','Igual'),
  MODIFY COLUMN `pneus` ENUM('Bom','Ruim','Igual'),
  MODIFY COLUMN `oleo` ENUM('Bom','Ruim','Igual'),
  MODIFY COLUMN `aguaRadiador` ENUM('Bom','Ruim','Igual'),
  ADD COLUMN IF NOT EXISTS `assinaturaUrl` TEXT;

ALTER TABLE `orders` ADD `contrato` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `tipoServico` enum('Corretiva','Preventiva','Reforma');--> statement-breakpoint
ALTER TABLE `orders` ADD `placaMatricula` varchar(60);--> statement-breakpoint
ALTER TABLE `orders` ADD `kmHorimetro` varchar(60);--> statement-breakpoint
ALTER TABLE `orders` ADD `kmHorimetroFotoUrl` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `evidenciaFotos` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `informeTecnico` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `orcamentoEmpresa` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `orcamentoCnpj` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` ADD `orcamentoPagamento` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `orcamentoPrazo` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `orcamentoBanco` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `orcamentoAgencia` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` ADD `orcamentoConta` varchar(30);--> statement-breakpoint
ALTER TABLE `orders` ADD `orcamentoTitular` varchar(255);
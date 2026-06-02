# Sistema de Ordens de Compra e Serviço — TODO

## Schema & Database
- [x] Tabela users (estender com email único)
- [x] Tabela orders (OC/OS, status, criador, placa)
- [x] Tabela order_items (itens usados por ordem)
- [x] Tabela inventory_items (cadastro de itens de estoque)
- [x] Tabela inventory_movements (entradas/saídas com rastreamento)
- [x] Tabela maintenance_alerts (alertas por placa)
- [x] Aplicar migration SQL via drizzle-kit migrate

## Backend (tRPC Routers)
- [x] Router: users — CRUD, filtros, proteção último admin
- [x] Router: orders — criar OC/OS, filtros, detalhes, itens
- [x] Router: inventory — cadastro de itens, movimentações, relatório
- [x] Router: maintenanceAlerts — criar, listar, resolver alertas
- [x] Router: dashboard — stats agregadas
- [x] Exportação CSV e Excel no frontend com lib export.ts

## Frontend — Layout & Tema
- [x] Tema visual elegante (paleta azul escuro/slate + dourado/âmbar como accent)
- [x] DashboardLayout com sidebar refinada e redimensionável
- [x] Navegação com ícones e labels para todas as seções
- [x] Responsividade e micro-interações
- [x] Badge de alertas pendentes na sidebar

## Frontend — Páginas
- [x] Dashboard (Home) com métricas resumidas e acesso rápido
- [x] Gerenciar Usuários (admin only) — CRUD, filtros, alterar perfil
- [x] Minhas Solicitações (ordens do usuário) com criação e filtros
- [x] Gerenciar Ordens (admin — todas as ordens) com exportação
- [x] Estoque — aba Itens (cadastro, edição, exclusão)
- [x] Estoque — aba Movimentações (com scan de código de barras)
- [x] Estoque — aba Relatório/Exportação (CSV e Excel)
- [x] Estoque — aba Estoque Atual (histórico por item em modal)
- [x] Alertas de Manutenção — criar, listar, resolver, filtrar por placa
- [x] Detalhe da Ordem — abas de itens e alertas, alterar status

## Funcionalidades Específicas
- [x] Filtros avançados: status, tipo, data, pendências, criador
- [x] Exportação CSV com timestamp e filtros aplicados
- [x] Exportação Excel formatado com cabeçalhos destacados
- [x] Scan de código de barras na aba Movimentações
- [x] Histórico de movimentações por item (para qual OS/OC foi)
- [x] Proteção: não deletar último admin
- [x] Validação de email único
- [x] RBAC: admin vs user nas procedures

## Testes
- [x] Testes vitest para routers principais (12 testes passando)
- [x] Checkpoint final

## Nova Solicitação (Wizard Multi-Etapas)
- [x] Atualizar schema: novos campos em orders (contrato, tipoServico, placaMatricula, kmHorimetro, informeTecnico, kmHorimetroFotoUrl, evidenciaFotos, orcamentoEmpresa, orcamentoCnpj, orcamentoPagamento, orcamentoPrazo, orcamentoBanco, orcamentoAgencia, orcamentoConta, orcamentoTitular)
- [x] Migration e aplicação no banco
- [x] Backend: atualizar router orders.create para aceitar novos campos
- [x] Backend: endpoint de upload de fotos via S3 (via tRPC base64)
- [x] Página wizard "Nova Solicitação" com seleção de tipo (OS/OC)
- [x] Wizard OS: etapas (dados básicos → identificação → KM/fotos → informe técnico → resumo)
- [x] Wizard OC: etapas (dados básicos → identificação → KM/fotos → informe técnico → orçamento → resumo)
- [x] Upload de fotos de evidência (múltiplas)
- [x] Upload de foto de KM/Horímetro (opcional)
- [x] Tela de resumo com botão confirmar ou editar
- [x] Integrar com página Minhas Solicitações
- [x] Adicionar link "Nova Solicitação" na sidebar
- [x] Testes unitários dos novos campos

## Melhorias v2
- [x] Minhas Solicitações: separar OS e OC em abas com contador
- [x] Minhas Solicitações: filtros visuais (checkboxes de status, categoria, alertas)
- [x] OS detalhe: modal de consulta de estoque ao adicionar itens
- [x] Usuários: botão para admin criar novo usuário
- [x] Estoque: scanner de câmera para cadastro automático de itens via código de barras

## Melhorias v3 — Fluxo OC e Estoque Reestruturado
- [x] Schema: adicionar status "Aprovada", "Reprovada", "Autorizada" em orders
- [x] Schema: adicionar campos ocNumber (número da OC), ocPdfUrl (PDF da OC) em orders
- [x] Schema: adicionar campo grupo em inventory_items
- [x] Schema: adicionar campos grupo, custoTotal, data, ocId, ocNumber, osId, veiculo em inventory_movements
- [x] Migration e aplicação no banco
- [x] Backend: router orders.approve (admin) — muda status para Aprovada
- [x] Backend: router orders.reject (admin) — muda status para Reprovada
- [x] Backend: router orders.authorize (admin) — registra ocNumber, faz upload PDF, muda status para Autorizada
- [x] Backend: router inventory.createEntry — entrada manual vinculada a OC Autorizada
- [x] Backend: router inventory.createExit — saída vinculada a OS obrigatoriamente
- [x] Backend: router inventory.listGroups — listar grupos distintos
- [x] Frontend: detalhe OC com botões Aprovar/Reprovar/Autorizar para admin
- [x] Frontend: campo Grupo no cadastro de item de estoque
- [x] Frontend: formulário de Entrada com vínculo OC (ID + número), grupo, custo total, data
- [x] Frontend: formulário de Saída com vínculo OS obrigatório, veículo, data
- [x] Frontend: filtros de movimentações por grupo, OS, veículo, período
- [x] Frontend: exportação CSV e Excel de movimentações com filtros

## Gaps v3 — Correções Pendentes
- [x] Filtro de período (data inicial/final) na aba Movimentações do estoque
- [x] Exportação CSV de movimentações respeitando filtros ativos
- [x] Exportação Excel de movimentações respeitando filtros ativos
- [x] Testes backend para novos campos: status OC, ocNumber, ocPdfUrl, grupo inventory

## Melhorias v4 — Entrada Manual + Checklist
- [x] Estoque: opção de entrada manual sem vínculo OC obrigatório (campo OC opcional)
- [x] Schema: tabela checklists (contrato, placa, km, inspetor, data, itens, fotos, observações, assinatura, osId)
- [x] Migration 0004 aplicada no banco
- [x] Backend: router checklists.create, list, getById, delete
- [x] Backend: filtros por placa, data, contrato, inspetor
- [x] Backend: exportação CSV e Excel de checklists
- [x] Frontend: aba Checklist na sidebar
- [x] Frontend: wizard multi-etapas (dados → itens → fotos → observações → assinatura → resumo)
- [x] Frontend: itens de verificação com status Sim/Não/Igual (Luzes, Freios, Pneus, Óleo, Água)
- [x] Frontend: upload de fotos (KM, frente, traseira, lateral dir/esq)
- [x] Frontend: campo de assinatura (canvas ou texto)
- [x] Frontend: filtros por placa, data, contrato, inspetor
- [x] Frontend: exportação CSV e Excel sem fotos
- [x] Frontend: botão "Criar OS" a partir do checklist com pré-preenchimento
- [x] Frontend: vínculo checklist → OS no detalhe da OS
- [x] Testes unitários para checklists router

## Melhorias v5 — Entrada de Estoque
- [x] Entrada de estoque: toggle "Vinculada a OC" / "Entrada Manual" — OC passa a ser opcional
- [x] Entrada de estoque: cálculo automático de Custo Total = Quantidade × Custo Unitário

## Bug Fixes
- [x] Estoque: erro "Duplicate entry for key barcode_unique" ao cadastrar item sem código de barras — corrigido convertendo string vazia para NULL no backend (createItem e updateItem); dados existentes com barcode='' corrigidos para NULL no banco

## OS + Estoque v2
- [x] OS: exibir valor total calculado (soma dos itens) na tela principal e na área de ações
- [x] OS: botão "Finalizar OS" — encerra a ordem e trava edição após finalização
- [x] OS: área de ações visível para usuário padrão (não apenas admin)
- [x] OS: usuário padrão pode adicionar itens, ver valor total e finalizar a OS
- [x] Estoque: saída pode ser vinculada a OS (principal) ou manual (sem OS)
- [x] Estoque: ao clicar em item, exibir histórico de saídas com: qtd, data, usuário, OS vinculada, veículo
- [x] Estoque: histórico por item com rastreabilidade completa

## OS + Estoque v3
- [x] OS: ao adicionar item na OS, registrar saída automática no estoque (movimentação "uso em OS")
- [x] OS: ao finalizar OS, verificar se saídas já foram registradas (evitar duplicação)
- [x] Gerenciar Ordens: separar em abas OS e OC
- [x] Gerenciar Ordens: adicionar filtro de contrato
- [x] Estoque: melhorar layout da aba de movimentações (nome do item em vez de #ID, melhor visualização)

## Contratos + Reversão de Estoque v4
- [x] OS: reversão automática de estoque ao remover item da OS (devolver quantidade + registrar movimento de devolução)
- [x] Schema: tabela contracts (id, name, code, status Ativo/Inativo, createdAt, updatedAt)
- [x] Schema: adicionar contractId (FK) em orders e checklists; manter campo contrato como texto legado
- [x] Migration e aplicação no banco
- [x] Backend: router contracts.list, create, update, delete (admin)
- [x] Backend: orders.list aceitar contractId como filtro
- [x] Backend: checklists.list aceitar contractId como filtro
- [x] Backend: orders.create e checklists.create receber contractId obrigatório
- [x] Frontend: página Contratos (CRUD) com tabela, criar/editar/inativar
- [x] Frontend: sidebar — adicionar link Contratos (admin)
- [x] Frontend: App.tsx — adicionar rota /contracts
- [x] Frontend: wizard NewRequest — substituir campo livre contrato por Select vinculado ao cadastro
- [x] Frontend: Checklist wizard — substituir campo livre contrato por Select vinculado ao cadastro
- [x] Frontend: Gerenciar Ordens — filtro de contrato via Select (não texto livre)
- [x] Frontend: Minhas Solicitações — filtro de contrato via Select
- [x] Frontend: Checklist — filtro de contrato via Select
- [x] Testes: atualizar testes de orders e checklists para contractId

## v6 - Login Local + Checklist + Renomeação
- [x] Renomear sistema para "Controle Administrativo" (VITE_APP_TITLE, sidebar, dashboard, HTML title)
- [x] Tela de login com credenciais locais (username + password), substituindo o botão "Entrar na Plataforma"
- [x] Backend: tabela app_users com username, passwordHash, role; procedures login/logout/createUser/listUsers/deleteUser
- [x] Frontend: página Login bonita com formulário username/senha
- [x] Frontend: página Usuários (admin) para criar/gerenciar usuários do sistema com senha
- [x] Checklist: mudar opções Sim/Não para Bom/Ruim nos itens de inspeção
- [x] Checklist: bloco de assinatura digital (canvas) no final do checklist
- [x] Backend: salvar assinatura como imagem base64 no banco (campo signatureData em checklists)
- [x] Frontend: exibir assinatura salva na visualização do checklist

## v7 - Barcode Auto-fill + Mobile
- [x] Estoque: ao escanear código de barras, buscar item existente e auto-preencher nome do produto
- [x] Estoque: se item não encontrado pelo barcode, manter campo nome editável para novo cadastro
- [x] Mobile: melhorar responsividade do Checklist (wizard, tabela, filtros)
- [x] Mobile: melhorar responsividade do Inventory (tabela de itens, movimentações, dialogs)
- [x] Mobile: melhorar responsividade geral (sidebar, tabelas, filtros, dialogs)

## Controle de Acesso v8 — Permissões de Usuário Padrão
- [x] Backend: orders.list — usuário padrão pode listar TODAS as OS (não apenas as próprias)
- [x] Backend: orders.getById — usuário padrão pode ver detalhes de qualquer OS
- [x] Backend: orders.addItem — bloquear se a OS não pertence ao usuário (exceto admin)
- [x] Backend: orders.removeItem — bloquear se a OS não pertence ao usuário (exceto admin)
- [x] Backend: orders.finalize — bloquear se a OS não pertence ao usuário (exceto admin)
- [x] Backend: orders.updateStatus — bloquear se a OS não pertence ao usuário (exceto admin)
- [x] Backend: orders.delete — bloquear se a OS não pertence ao usuário (exceto admin)
- [x] Frontend: MinhasSolicitações — mostrar TODAS as OS (não apenas do usuário logado)
- [x] Frontend: MinhasSolicitações — botões Editar/Finalizar/Excluir visíveis apenas para OS próprias ou admin
- [x] Frontend: OrderDetail — botões de ação (addItem, removeItem, finalize) visíveis apenas se dono ou admin
- [x] Frontend: Exportação de OS disponível para usuário padrão (botão Exportar CSV/Excel)
- [x] Testes: verificar que usuário padrão não consegue editar OS de outro usuário via backend

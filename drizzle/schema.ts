import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  index,
} from "drizzle-orm/mysql-core";

// ─── Roles ───────────────────────────────────────────────────────────────────
const userRoles = ["user", "admin", "estoquista"] as const;

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  openId: varchar("openId", { length: 64 }),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", userRoles).default("user").notNull(),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── App Users (Login Local) ────────────────────────────────────────────────
export const appUsers = mysqlTable(
  "app_users",
  {
    id: int("id").autoincrement().primaryKey(),

    username: varchar("username", { length: 64 }).notNull().unique(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),

    name: varchar("name", { length: 255 }).notNull(),

    role: mysqlEnum("role", ["user", "admin", "estoquista"])
      .default("user")
      .notNull(),

    empresa: mysqlEnum("empresa", ["GP", "NP", "TODAS"])
      .default("GP")
      .notNull(),

    active: mysqlEnum("active", ["yes", "no"])
      .default("yes")
      .notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn"),
  },
  (t) => [
    index("app_users_username_idx").on(t.username),
    index("app_users_role_idx").on(t.role),
    index("app_users_empresa_idx").on(t.empresa),
    index("app_users_active_idx").on(t.active),
  ]
);

export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = typeof appUsers.$inferInsert;

// ─── Contracts ───────────────────────────────────────────────────────────────
export const contracts = mysqlTable(
  "contracts",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),

    status: mysqlEnum("status", ["Ativo", "Inativo"])
      .default("Ativo")
      .notNull(),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("contracts_empresa_idx").on(t.empresa),
    index("contracts_status_idx").on(t.status),
  ]
);

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliers = mysqlTable(
  "suppliers",
  {
    id: int("id").autoincrement().primaryKey(),

    type: mysqlEnum("type", ["Cliente", "Fornecedor"])
      .default("Fornecedor")
      .notNull(),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    cnpj: varchar("cnpj", { length: 20 }),
    razaoSocial: varchar("razaoSocial", { length: 255 }).notNull(),
    nomeFantasia: varchar("nomeFantasia", { length: 255 }),

    inscricaoEstadual: varchar("inscricaoEstadual", { length: 50 }),
    inscricaoMunicipal: varchar("inscricaoMunicipal", { length: 50 }),
    situacao: varchar("situacao", { length: 100 }),
    porte: varchar("porte", { length: 100 }),

    cep: varchar("cep", { length: 20 }),
    endereco: varchar("endereco", { length: 255 }),
    numero: varchar("numero", { length: 50 }),
    complemento: varchar("complemento", { length: 255 }),
    bairro: varchar("bairro", { length: 100 }),
    municipio: varchar("municipio", { length: 100 }),
    uf: varchar("uf", { length: 2 }),
    pais: varchar("pais", { length: 100 }).default("BRASIL"),

    telefone: varchar("telefone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    contato: varchar("contato", { length: 255 }),

    banco: varchar("banco", { length: 100 }),
    agencia: varchar("agencia", { length: 50 }),
    conta: varchar("conta", { length: 100 }),
    tipoConta: varchar("tipoConta", { length: 50 }),
    titular: varchar("titular", { length: 255 }),
    pix: varchar("pix", { length: 255 }),

    categoria: varchar("categoria", { length: 100 }),
    observacoes: text("observacoes"),

    status: mysqlEnum("status", ["Ativo", "Inativo"])
      .default("Ativo")
      .notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("suppliers_empresa_idx").on(t.empresa),
    index("suppliers_status_idx").on(t.status),
    index("suppliers_cnpj_idx").on(t.cnpj),
    index("suppliers_razaoSocial_idx").on(t.razaoSocial),
  ]
);

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ─── Expense Groups ─────────────────────────────────────────────────────────
export const expenseGroups = mysqlTable(
  "expense_groups",
  {
    id: int("id").autoincrement().primaryKey(),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    acronym: varchar("acronym", { length: 50 }),

    financialType: mysqlEnum("financialType", [
      "Administrativo",
      "Operacional",
      "Manutenção",
      "Estoque",
      "Financeiro",
      "Impostos",
      "Encargos",
      "Investimento",
      "Pessoal",
      "Transporte",
      "Tecnologia",
      "Locação",
      "Outros",
    ])
      .default("Operacional")
      .notNull(),

    description: text("description"),

    status: mysqlEnum("status", ["Ativo", "Inativo"])
      .default("Ativo")
      .notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("expense_groups_empresa_idx").on(t.empresa),
    index("expense_groups_name_idx").on(t.name),
    index("expense_groups_acronym_idx").on(t.acronym),
    index("expense_groups_financial_type_idx").on(t.financialType),
    index("expense_groups_status_idx").on(t.status),
  ]
);

export type ExpenseGroup = typeof expenseGroups.$inferSelect;
export type InsertExpenseGroup = typeof expenseGroups.$inferInsert;

// ─── Expense Categories ──────────────────────────────────────────────────────
export const expenseCategories = mysqlTable(
  "expense_categories",
  {
    id: int("id").autoincrement().primaryKey(),

    groupId: int("groupId").notNull(),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    normalizedName: varchar("normalizedName", { length: 255 }),

    appliesTo: mysqlEnum("appliesTo", ["OS", "ESTOQUE", "TODOS"])
      .default("TODOS")
      .notNull(),

    status: mysqlEnum("status", ["Ativo", "Inativo"])
      .default("Ativo")
      .notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("expense_categories_group_idx").on(t.groupId),
    index("expense_categories_empresa_idx").on(t.empresa),
    index("expense_categories_name_idx").on(t.name),
    index("expense_categories_applies_to_idx").on(t.appliesTo),
    index("expense_categories_status_idx").on(t.status),
  ]
);

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

// ─── Orders (OS apenas) ────────────────────────────────────────────────────────
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),

    type: mysqlEnum("type", ["OS"]).default("OS").notNull(),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    status: mysqlEnum("status", [
      "Ativo",
      "Inativo",
      "Pendente",
      "Concluído",
      "Reaberta",
    ])
      .default("Pendente")
      .notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    licensePlate: varchar("licensePlate", { length: 20 }),
    vehicleId: int("vehicleId"),
    checklistId: int("checklistId"),

    creatorId: int("creatorId").notNull(),
    creatorName: varchar("creatorName", { length: 255 }),

    contractId: int("contractId"),
    contrato: varchar("contrato", { length: 255 }),

    expenseGroupId: int("expenseGroupId"),
    expenseGroupName: varchar("expenseGroupName", { length: 255 }),
    expenseCategoryId: int("expenseCategoryId"),
    expenseCategoryName: varchar("expenseCategoryName", { length: 255 }),

    tipoServico: mysqlEnum("tipoServico", [
      "Corretiva",
      "Preventiva",
      "Reforma",
    ]),

    placaMatricula: varchar("placaMatricula", { length: 60 }),
    kmHorimetro: varchar("kmHorimetro", { length: 60 }),
    kmHorimetroFotoUrl: text("kmHorimetroFotoUrl"),
    evidenciaFotos: text("evidenciaFotos"),
    informeTecnico: text("informeTecnico"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  (t) => [
    index("orders_empresa_idx").on(t.empresa),
    index("orders_creatorId_idx").on(t.creatorId),
    index("orders_status_idx").on(t.status),
    index("orders_vehicleId_idx").on(t.vehicleId),
    index("orders_contractId_idx").on(t.contractId),
    index("orders_expenseGroupId_idx").on(t.expenseGroupId),
    index("orders_expenseCategoryId_idx").on(t.expenseCategoryId),
  ]
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ─────────────────────────────────────────────────────────────
export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").autoincrement().primaryKey(),

    orderId: int("orderId").notNull(),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    inventoryItemId: int("inventoryItemId"),

    itemName: varchar("itemName", { length: 255 }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
    unitCost: decimal("unitCost", { precision: 12, scale: 2 }),
    unit: varchar("unit", { length: 32 }),
    notes: text("notes"),

    expenseGroupId: int("expenseGroupId"),
    expenseGroupName: varchar("expenseGroupName", { length: 255 }),
    expenseCategoryId: int("expenseCategoryId"),
    expenseCategoryName: varchar("expenseCategoryName", { length: 255 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("order_items_orderId_idx").on(t.orderId),
    index("order_items_empresa_idx").on(t.empresa),
    index("order_items_expenseGroupId_idx").on(t.expenseGroupId),
    index("order_items_expenseCategoryId_idx").on(t.expenseCategoryId),
  ]
);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Order Material Requests ─────────────────────────────────────────────────
export const orderMaterialRequests = mysqlTable(
  "order_material_requests",
  {
    id: int("id").autoincrement().primaryKey(),

    orderId: int("orderId").notNull(),
    inventoryItemId: int("inventoryItemId"),

    itemName: varchar("itemName", { length: 255 }).notNull(),

    quantityRequested: decimal("quantityRequested", {
      precision: 10,
      scale: 3,
    }).notNull(),

    quantityDelivered: decimal("quantityDelivered", {
      precision: 10,
      scale: 3,
    })
      .notNull()
      .default("0"),

    unit: varchar("unit", { length: 50 }),
    unitCost: decimal("unitCost", { precision: 12, scale: 2 }),

    status: mysqlEnum("status", [
      "Solicitado",
      "Separado",
      "Entregue",
      "Cancelado",
    ])
      .default("Solicitado")
      .notNull(),

    notes: text("notes"),

    requestedById: int("requestedById").notNull(),
    requestedByName: varchar("requestedByName", { length: 255 }),
    withdrawnByName: varchar("withdrawnByName", { length: 255 }),
    withdrawnAt: timestamp("withdrawnAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("order_mat_req_orderId_idx").on(t.orderId),
    index("order_mat_req_inventoryItemId_idx").on(t.inventoryItemId),
    index("order_mat_req_status_idx").on(t.status),
  ]
);

export type OrderMaterialRequest = typeof orderMaterialRequests.$inferSelect;
export type InsertOrderMaterialRequest =
  typeof orderMaterialRequests.$inferInsert;

// ─── Inventory Items ──────────────────────────────────────────────────────────
export const inventoryItems = mysqlTable(
  "inventory_items",
  {
    id: int("id").autoincrement().primaryKey(),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    barcode: varchar("barcode", { length: 128 }),

    unit: varchar("unit", { length: 32 }).default("un").notNull(),
    grupo: varchar("grupo", { length: 128 }),

    currentQuantity: decimal("currentQuantity", {
      precision: 10,
      scale: 3,
    })
      .notNull()
      .default("0"),

    minQuantity: decimal("minQuantity", { precision: 10, scale: 3 }).default(
      "0"
    ),

    lastUnitCost: decimal("lastUnitCost", { precision: 12, scale: 2 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("inv_items_empresa_idx").on(t.empresa),
    index("inv_items_name_idx").on(t.name),
    index("inv_items_barcode_idx").on(t.barcode),
    index("inv_items_grupo_idx").on(t.grupo),
  ]
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

// ─── Inventory Movements ──────────────────────────────────────────────────────
export const inventoryMovements = mysqlTable(
  "inventory_movements",
  {
    id: int("id").autoincrement().primaryKey(),

    inventoryItemId: int("inventoryItemId").notNull(),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    type: mysqlEnum("type", [
      "entrada",
      "saída",
      "ajuste_positivo",
      "ajuste_negativo",
      "uso_em_os",
      "devolução_de_os",
    ]).notNull(),

    quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),

    unitCost: decimal("unitCost", { precision: 12, scale: 2 }),
    totalCost: decimal("totalCost", { precision: 14, scale: 2 }),

    reason: varchar("reason", { length: 255 }).notNull(),
    description: text("description"),

    grupo: varchar("grupo", { length: 128 }),

    expenseGroupId: int("expenseGroupId"),
    expenseGroupName: varchar("expenseGroupName", { length: 255 }),
    expenseCategoryId: int("expenseCategoryId"),
    expenseCategoryName: varchar("expenseCategoryName", { length: 255 }),

    veiculo: varchar("veiculo", { length: 60 }),

    osOrderId: int("osOrderId"),
    osOrderNumber: varchar("osOrderNumber", { length: 32 }),

    movementDate: timestamp("movementDate").defaultNow().notNull(),

    performedById: int("performedById").notNull(),
    performedByName: varchar("performedByName", { length: 255 }),

    performedAt: timestamp("performedAt").defaultNow().notNull(),
  },
  (t) => [
    index("inv_mov_itemId_idx").on(t.inventoryItemId),
    index("inv_mov_empresa_idx").on(t.empresa),
    index("inv_mov_osOrderId_idx").on(t.osOrderId),
    index("inv_mov_grupo_idx").on(t.grupo),
    index("inv_mov_expenseGroupId_idx").on(t.expenseGroupId),
    index("inv_mov_expenseCategoryId_idx").on(t.expenseCategoryId),
  ]
);

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = typeof inventoryMovements.$inferInsert;

// ─── Maintenance Alerts ─────────────────────────────────────────────────────
export const maintenanceAlerts = mysqlTable(
  "maintenance_alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    licensePlate: varchar("licensePlate", { length: 20 }).notNull(),
    description: text("description").notNull(),
    resolved: mysqlEnum("resolved", ["yes", "no"]).default("no").notNull(),
    orderId: int("orderId"),
    orderNumber: varchar("orderNumber", { length: 32 }),
    createdById: int("createdById").notNull(),
    createdByName: varchar("createdByName", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  (t) => [
    index("maint_alerts_plate_idx").on(t.licensePlate),
    index("maint_alerts_resolved_idx").on(t.resolved),
  ]
);

export type MaintenanceAlert = typeof maintenanceAlerts.$inferSelect;
export type InsertMaintenanceAlert = typeof maintenanceAlerts.$inferInsert;

// ─── Checklists ──────────────────────────────────────────────────────────────
export const checklists = mysqlTable(
  "checklists",
  {
    id: int("id").autoincrement().primaryKey(),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    contractId: int("contractId"),
    contrato: varchar("contrato", { length: 255 }).notNull(),
    placa: varchar("placa", { length: 60 }).notNull(),
    km: varchar("km", { length: 60 }).notNull(),
    inspetor: varchar("inspetor", { length: 255 }).notNull(),
    dataVistoria: timestamp("dataVistoria").notNull(),

    luzes: mysqlEnum("luzes", ["Bom", "Ruim", "Igual"]),
    freios: mysqlEnum("freios", ["Bom", "Ruim", "Igual"]),
    pneus: mysqlEnum("pneus", ["Bom", "Ruim", "Igual"]),
    oleo: mysqlEnum("oleo", ["Bom", "Ruim", "Igual"]),
    aguaRadiador: mysqlEnum("aguaRadiador", ["Bom", "Ruim", "Igual"]),

    fotoKmUrl: text("fotoKmUrl"),
    fotoFrenteUrl: text("fotoFrenteUrl"),
    fotoTraseiraUrl: text("fotoTraseiraUrl"),
    fotoLateralDirUrl: text("fotoLateralDirUrl"),
    fotoLateralEsqUrl: text("fotoLateralEsqUrl"),

    observacoes: text("observacoes"),
    assinatura: text("assinatura"),
    assinaturaType: mysqlEnum("assinaturaType", ["canvas", "texto"]).default(
      "texto"
    ),
    assinaturaUrl: text("assinaturaUrl"),

    osId: int("osId"),
    osOrderNumber: varchar("osOrderNumber", { length: 32 }),

    createdById: int("createdById").notNull(),
    createdByName: varchar("createdByName", { length: 255 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("checklists_empresa_idx").on(t.empresa),
    index("checklists_placa_idx").on(t.placa),
    index("checklists_contrato_idx").on(t.contrato),
    index("checklists_inspetor_idx").on(t.inspetor),
    index("checklists_data_idx").on(t.dataVistoria),
    index("checklists_osId_idx").on(t.osId),
  ]
);

export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = typeof checklists.$inferInsert;

// ─── Fleet Vehicles ──────────────────────────────────────────────────────────
export const fleetVehicles = mysqlTable(
  "fleet_vehicles",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }),
    type: varchar("type", { length: 50 }).default("veiculo").notNull(),
    matricula: varchar("matricula", { length: 50 }),
    plate: varchar("plate", { length: 20 }),
    modelo: varchar("modelo", { length: 100 }).notNull(),
    marca: varchar("marca", { length: 100 }),
    chassi: varchar("chassi", { length: 100 }),
    renavam: varchar("renavam", { length: 50 }),
    ano: int("ano"),
    combustivel: varchar("combustivel", { length: 50 }),
    proprietario: varchar("proprietario", { length: 255 }),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    status: mysqlEnum("status", [
      "Ativo",
      "Em manutenção",
      "Devolvido",
      "Vendido",
    ])
      .default("Ativo")
      .notNull(),

    crlvNumber: varchar("crlvNumber", { length: 100 }),
    crlvExpirationDate: timestamp("crlvExpirationDate"),
    tacografoNumber: varchar("tacografoNumber", { length: 100 }),
    tacografoExpirationDate: timestamp("tacografoExpirationDate"),
    artNumber: varchar("artNumber", { length: 100 }),
    artExpirationDate: timestamp("artExpirationDate"),

    currentContractId: int("currentContractId"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("fleet_empresa_idx").on(t.empresa),
    index("fleet_plate_idx").on(t.plate),
    index("fleet_matricula_idx").on(t.matricula),
    index("fleet_modelo_idx").on(t.modelo),
    index("fleet_current_contract_idx").on(t.currentContractId),
    index("fleet_status_idx").on(t.status),
  ]
);

export type FleetVehicle = typeof fleetVehicles.$inferSelect;
export type InsertFleetVehicle = typeof fleetVehicles.$inferInsert;

// ─── Maintenance Plans ───────────────────────────────────────────────────────
export const maintenancePlans = mysqlTable(
  "maintenance_plans",
  {
    id: int("id").autoincrement().primaryKey(),

    vehicleId: int("vehicleId").notNull(),

    empresa: mysqlEnum("empresa", ["GP", "NP"])
      .default("GP")
      .notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    type: mysqlEnum("type", [
      "Preventiva",
      "Corretiva Programada",
      "Inspeção",
      "Documentação",
      "Lubrificação",
      "Troca",
      "Outro",
    ])
      .default("Preventiva")
      .notNull(),

    status: mysqlEnum("status", [
      "Em dia",
      "Próximo",
      "Vencido",
      "Pausado",
      "Inativo",
    ])
      .default("Em dia")
      .notNull(),

    priority: mysqlEnum("priority", ["Baixa", "Média", "Alta", "Crítica"])
      .default("Média")
      .notNull(),

    contractId: int("contractId"),
    contrato: varchar("contrato", { length: 255 }),

    intervalKm: int("intervalKm"),
    intervalHours: int("intervalHours"),
    intervalDays: int("intervalDays"),

    currentKm: int("currentKm"),
    currentHours: int("currentHours"),

    lastKm: int("lastKm"),
    lastHours: int("lastHours"),
    lastDate: timestamp("lastDate"),

    nextKm: int("nextKm"),
    nextHours: int("nextHours"),
    nextDate: timestamp("nextDate"),

    advanceAlertKm: int("advanceAlertKm").default(1000),
    advanceAlertHours: int("advanceAlertHours").default(50),
    advanceAlertDays: int("advanceAlertDays").default(15),

    autoGenerateOs: mysqlEnum("autoGenerateOs", ["yes", "no"])
      .default("no")
      .notNull(),

    lastOrderId: int("lastOrderId"),
    lastOrderNumber: varchar("lastOrderNumber", { length: 32 }),

    notes: text("notes"),

    createdById: int("createdById"),
    createdByName: varchar("createdByName", { length: 255 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("maintenance_plans_empresa_idx").on(t.empresa),
    index("maintenance_plans_vehicle_idx").on(t.vehicleId),
    index("maintenance_plans_contract_idx").on(t.contractId),
    index("maintenance_plans_status_idx").on(t.status),
    index("maintenance_plans_type_idx").on(t.type),
    index("maintenance_plans_nextDate_idx").on(t.nextDate),
  ]
);

export type MaintenancePlan = typeof maintenancePlans.$inferSelect;
export type InsertMaintenancePlan = typeof maintenancePlans.$inferInsert;

// ─── Maintenance Plan Executions ─────────────────────────────────────────────
export const maintenancePlanExecutions = mysqlTable(
  "maintenance_plan_executions",
  {
    id: int("id").autoincrement().primaryKey(),

    planId: int("planId").notNull(),
    vehicleId: int("vehicleId").notNull(),

    orderId: int("orderId"),
    orderNumber: varchar("orderNumber", { length: 32 }),

    executedKm: int("executedKm"),
    executedHours: int("executedHours"),
    executedDate: timestamp("executedDate").notNull(),

    nextKm: int("nextKm"),
    nextHours: int("nextHours"),
    nextDate: timestamp("nextDate"),

    notes: text("notes"),

    executedById: int("executedById"),
    executedByName: varchar("executedByName", { length: 255 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [
    index("maintenance_plan_exec_plan_idx").on(t.planId),
    index("maintenance_plan_exec_vehicle_idx").on(t.vehicleId),
    index("maintenance_plan_exec_order_idx").on(t.orderId),
    index("maintenance_plan_exec_date_idx").on(t.executedDate),
  ]
);

export type MaintenancePlanExecution =
  typeof maintenancePlanExecutions.$inferSelect;

export type InsertMaintenancePlanExecution =
  typeof maintenancePlanExecutions.$inferInsert;

// ─── Fleet Vehicle Contract History ──────────────────────────────────────────
export const fleetVehicleContractHistory = mysqlTable(
  "fleet_vehicle_contract_history",
  {
    id: int("id").autoincrement().primaryKey(),
    vehicleId: int("vehicleId").notNull(),
    contractId: int("contractId").notNull(),
    mobilizationDate: timestamp("mobilizationDate").notNull(),
    demobilizationDate: timestamp("demobilizationDate"),
    notes: text("notes"),
    changedById: int("changedById"),
    changedByName: varchar("changedByName", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("fleet_hist_vehicle_idx").on(t.vehicleId),
    index("fleet_hist_contract_idx").on(t.contractId),
    index("fleet_hist_mobilization_idx").on(t.mobilizationDate),
  ]
);

export type FleetVehicleContractHistory =
  typeof fleetVehicleContractHistory.$inferSelect;

export type InsertFleetVehicleContractHistory =
  typeof fleetVehicleContractHistory.$inferInsert;

// ─── User Company Permissions ───────────────────────────────────────────────
export const userCompanyPermissions = mysqlTable(
  "user_company_permissions",
  {
    id: int("id").autoincrement().primaryKey(),

    userId: int("userId").notNull(),

    empresa: mysqlEnum("empresa", ["GP", "NP"]).notNull(),

    canView: mysqlEnum("canView", ["yes", "no"])
      .default("yes")
      .notNull(),

    canCreate: mysqlEnum("canCreate", ["yes", "no"])
      .default("yes")
      .notNull(),

    canManageUsers: mysqlEnum("canManageUsers", ["yes", "no"])
      .default("no")
      .notNull(),

    canManageFinancial: mysqlEnum("canManageFinancial", ["yes", "no"])
      .default("no")
      .notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("user_company_permissions_user_idx").on(t.userId),
    index("user_company_permissions_empresa_idx").on(t.empresa),
  ]
);

export type UserCompanyPermission =
  typeof userCompanyPermissions.$inferSelect;

export type InsertUserCompanyPermission =
  typeof userCompanyPermissions.$inferInsert;

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { 
  appUsers, 
  contracts, 
  suppliers, 
  orders, 
  inventoryItems, 
  inventoryMovements, 
  maintenanceAlerts, 
  checklists,
  expenseGroups,
  expenseCategories,
  fleetVehicles,
  maintenancePlans
} from "../../drizzle/schema";

const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Helper to infer types
type AppUser = typeof appUsers.$inferSelect;
type Contract = typeof contracts.$inferSelect;
type Supplier = typeof suppliers.$inferSelect;
type Order = typeof orders.$inferSelect;
type InventoryItem = typeof inventoryItems.$inferSelect;
type InventoryMovement = typeof inventoryMovements.$inferSelect;
type MaintenanceAlert = typeof maintenanceAlerts.$inferSelect;
type Checklist = typeof checklists.$inferSelect;
type ExpenseGroup = typeof expenseGroups.$inferSelect;
type ExpenseCategory = typeof expenseCategories.$inferSelect;
type FleetVehicle = typeof fleetVehicles.$inferSelect;
type MaintenancePlan = typeof maintenancePlans.$inferSelect;

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(() => ({ id: 1, name: "Admin", role: "admin" as "admin" | "user" | "estoquista", empresa: "GP" as const })),
    logout: publicProcedure.mutation(() => ({ success: true })),
  }),
  dashboard: router({
    stats: publicProcedure.query(() => ({ 
      orders: 0, 
      inventory: 0, 
      alerts: 0,
      totalOsValue: 0,
      pendingChecklists: 0
    })),
  }),
  users: router({
    list: publicProcedure.query((): AppUser[] => []),
  }),
  appUsers: router({
    login: publicProcedure.input(z.object({
      username: z.string(),
      password: z.string(),
    })).mutation(() => ({ success: true, user: { id: 1, name: "Admin", role: "admin" as const } })),
    list: publicProcedure.query((): AppUser[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
  }),
  contracts: router({
    list: publicProcedure.input(z.any().optional()).query((): Contract[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    update: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
  }),
  suppliers: router({
    list: publicProcedure.input(z.any().optional()).query((): Supplier[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    update: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
  }),
  orders: router({
    list: publicProcedure.input(z.any().optional()).query((): Order[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true, id: 1 })),
    finalize: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
    finalizeOS: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
    getById: publicProcedure.input(z.any()).query((): (Order & { items: any[], checklist: any, alerts: any[] }) | null => null),
    addItem: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    removeItem: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    updateStatus: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    uploadPhoto: publicProcedure.input(z.any()).mutation(() => ({ url: "https://example.com/photo.jpg" })),
  }),
  inventory: router({
    list: publicProcedure.input(z.any().optional()).query((): InventoryItem[] => []),
    listItems: publicProcedure.query((): InventoryItem[] => []),
    createItem: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    updateItem: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    deleteItem: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
    listGroups: publicProcedure.query((): string[] => []),
    createEntry: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    createExit: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    createMovement: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    getMovements: publicProcedure.input(z.any().optional()).query((): any[] => []),
    listMovements: publicProcedure.input(z.any().optional()).query((): any[] => []),
    getItemHistory: publicProcedure.input(z.number()).query((): InventoryMovement[] => []),
    getByBarcode: publicProcedure.input(z.string()).query((): InventoryItem | null => null),
    getItemByBarcode: publicProcedure.input(z.any()).query((): InventoryItem | null => null),
  }),
  materialRequests: router({
    list: publicProcedure.input(z.any().optional()).query((): any[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    deliver: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    separate: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    cancel: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
  }),
  maintenanceAlerts: router({
    list: publicProcedure.input(z.any().optional()).query((): MaintenanceAlert[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    resolve: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
  }),
  checklists: router({
    list: publicProcedure.input(z.any().optional()).query((): Checklist[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    getById: publicProcedure.input(z.number()).query((): Checklist | null => null),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
  }),
  expenseGroups: router({
    list: publicProcedure.input(z.any().optional()).query((): ExpenseGroup[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    update: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
  }),
  expenseCategories: router({
    list: publicProcedure.input(z.any().optional()).query((): ExpenseCategory[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    update: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
  }),
  fleet: router({
    list: publicProcedure.input(z.any().optional()).query((): FleetVehicle[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    update: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
    getById: publicProcedure.input(z.number()).query((): FleetVehicle | null => null),
  }),
  maintenancePlans: router({
    list: publicProcedure.input(z.any().optional()).query((): MaintenancePlan[] => []),
    create: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    update: publicProcedure.input(z.any()).mutation(() => ({ success: true })),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(() => ({ success: true })),
  }),
});

export type AppRouter = typeof appRouter;

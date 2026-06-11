import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Database } from "../_core/db";
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
import { eq, and, or } from "drizzle-orm";

// Define context type
export interface Context {
  db: Database;
  user?: {
    userId: number;
    username: string;
    role: "admin" | "user" | "estoquista";
    empresa: "GP" | "NP";
  };
  req?: any;
}

const t = initTRPC.createContextInnerFunction<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

// Admin-only procedure
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this resource",
    });
  }
  return next();
});

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

// Import auth router
import { authRouter } from "./auth";

export const appRouter = router({
  auth: authRouter,

  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      try {
        const orderCount = await ctx.db.query.orders.findMany({
          where: eq(orders.createdById, ctx.user!.userId),
        });

        const inventoryCount = await ctx.db.query.inventoryItems.findMany();

        const alertCount = await ctx.db.query.maintenanceAlerts.findMany({
          where: eq(maintenanceAlerts.status, "pending"),
        });

        return {
          orders: orderCount.length,
          inventory: inventoryCount.length,
          alerts: alertCount.length,
          totalOsValue: 0,
          pendingChecklists: 0,
        };
      } catch (error) {
        console.error("Dashboard stats error:", error);
        return {
          orders: 0,
          inventory: 0,
          alerts: 0,
          totalOsValue: 0,
          pendingChecklists: 0,
        };
      }
    }),
  }),

  contracts: router({
    list: protectedProcedure
      .input(z.object({ empresa: z.enum(["GP", "NP"]).optional() }).optional())
      .query(async ({ ctx, input }) => {
        try {
          const where = input?.empresa ? eq(contracts.empresa, input.empresa) : undefined;
          return await ctx.db.query.contracts.findMany({ where });
        } catch (error) {
          console.error("Contracts list error:", error);
          return [];
        }
      }),

    create: protectedProcedure
      .input(
        z.object({
          contractNumber: z.string(),
          supplier: z.string(),
          startDate: z.date(),
          endDate: z.date(),
          empresa: z.enum(["GP", "NP"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await ctx.db.insert(contracts).values({
            contractNumber: input.contractNumber,
            supplier: input.supplier,
            startDate: input.startDate,
            endDate: input.endDate,
            empresa: input.empresa,
            notes: input.notes,
            createdById: ctx.user!.userId,
            createdByName: ctx.user!.username,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return { success: true, id: result.insertId };
        } catch (error) {
          console.error("Contract creation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create contract",
          });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db.delete(contracts).where(eq(contracts.id, input.id));
          return { success: true };
        } catch (error) {
          console.error("Contract deletion error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete contract",
          });
        }
      }),
  }),

  orders: router({
    list: protectedProcedure
      .input(z.any().optional())
      .query(async ({ ctx }) => {
        try {
          return await ctx.db.query.orders.findMany();
        } catch (error) {
          console.error("Orders list error:", error);
          return [];
        }
      }),

    create: protectedProcedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await ctx.db.insert(orders).values({
            ...input,
            createdById: ctx.user!.userId,
            createdByName: ctx.user!.username,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return { success: true, id: result.insertId };
        } catch (error) {
          console.error("Order creation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create order",
          });
        }
      }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        try {
          const order = await ctx.db.query.orders.findFirst({
            where: eq(orders.id, input),
          });

          return order || null;
        } catch (error) {
          console.error("Get order error:", error);
          return null;
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db.delete(orders).where(eq(orders.id, input.id));
          return { success: true };
        } catch (error) {
          console.error("Order deletion error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete order",
          });
        }
      }),
  }),

  inventory: router({
    list: protectedProcedure
      .input(z.any().optional())
      .query(async ({ ctx }) => {
        try {
          return await ctx.db.query.inventoryItems.findMany();
        } catch (error) {
          console.error("Inventory list error:", error);
          return [];
        }
      }),

    createItem: protectedProcedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await ctx.db.insert(inventoryItems).values({
            ...input,
            createdById: ctx.user!.userId,
            createdByName: ctx.user!.username,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return { success: true, id: result.insertId };
        } catch (error) {
          console.error("Inventory item creation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create inventory item",
          });
        }
      }),

    deleteItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db.delete(inventoryItems).where(eq(inventoryItems.id, input.id));
          return { success: true };
        } catch (error) {
          console.error("Inventory item deletion error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete inventory item",
          });
        }
      }),

    getByBarcode: publicProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        try {
          return await ctx.db.query.inventoryItems.findFirst({
            where: eq(inventoryItems.barcode, input),
          });
        } catch (error) {
          console.error("Get item by barcode error:", error);
          return null;
        }
      }),
  }),

  maintenanceAlerts: router({
    list: protectedProcedure
      .input(z.any().optional())
      .query(async ({ ctx }) => {
        try {
          return await ctx.db.query.maintenanceAlerts.findMany();
        } catch (error) {
          console.error("Maintenance alerts list error:", error);
          return [];
        }
      }),

    create: protectedProcedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await ctx.db.insert(maintenanceAlerts).values({
            ...input,
            createdById: ctx.user!.userId,
            createdByName: ctx.user!.username,
            createdAt: new Date(),
          });

          return { success: true, id: result.insertId };
        } catch (error) {
          console.error("Maintenance alert creation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create maintenance alert",
          });
        }
      }),

    resolve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db
            .update(maintenanceAlerts)
            .set({ status: "resolved", updatedAt: new Date() })
            .where(eq(maintenanceAlerts.id, input.id));

          return { success: true };
        } catch (error) {
          console.error("Maintenance alert resolution error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to resolve maintenance alert",
          });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db.delete(maintenanceAlerts).where(eq(maintenanceAlerts.id, input.id));
          return { success: true };
        } catch (error) {
          console.error("Maintenance alert deletion error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete maintenance alert",
          });
        }
      }),
  }),

  checklists: router({
    list: protectedProcedure
      .input(z.any().optional())
      .query(async ({ ctx }) => {
        try {
          return await ctx.db.query.checklists.findMany();
        } catch (error) {
          console.error("Checklists list error:", error);
          return [];
        }
      }),

    create: protectedProcedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await ctx.db.insert(checklists).values({
            ...input,
            createdById: ctx.user!.userId,
            createdByName: ctx.user!.username,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return { success: true, id: result.insertId };
        } catch (error) {
          console.error("Checklist creation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checklist",
          });
        }
      }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        try {
          return await ctx.db.query.checklists.findFirst({
            where: eq(checklists.id, input),
          });
        } catch (error) {
          console.error("Get checklist error:", error);
          return null;
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db.delete(checklists).where(eq(checklists.id, input.id));
          return { success: true };
        } catch (error) {
          console.error("Checklist deletion error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete checklist",
          });
        }
      }),
  }),

  expenseGroups: router({
    list: protectedProcedure
      .input(z.any().optional())
      .query(async ({ ctx }) => {
        try {
          return await ctx.db.query.expenseGroups.findMany();
        } catch (error) {
          console.error("Expense groups list error:", error);
          return [];
        }
      }),

    create: protectedProcedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await ctx.db.insert(expenseGroups).values({
            ...input,
            createdById: ctx.user!.userId,
            createdByName: ctx.user!.username,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return { success: true, id: result.insertId };
        } catch (error) {
          console.error("Expense group creation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create expense group",
          });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db.delete(expenseGroups).where(eq(expenseGroups.id, input.id));
          return { success: true };
        } catch (error) {
          console.error("Expense group deletion error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete expense group",
          });
        }
      }),
  }),

  fleet: router({
    list: protectedProcedure
      .input(z.any().optional())
      .query(async ({ ctx }) => {
        try {
          return await ctx.db.query.fleetVehicles.findMany();
        } catch (error) {
          console.error("Fleet list error:", error);
          return [];
        }
      }),

    create: protectedProcedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await ctx.db.insert(fleetVehicles).values({
            ...input,
            createdById: ctx.user!.userId,
            createdByName: ctx.user!.username,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return { success: true, id: result.insertId };
        } catch (error) {
          console.error("Fleet vehicle creation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create fleet vehicle",
          });
        }
      }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        try {
          return await ctx.db.query.fleetVehicles.findFirst({
            where: eq(fleetVehicles.id, input),
          });
        } catch (error) {
          console.error("Get fleet vehicle error:", error);
          return null;
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db.delete(fleetVehicles).where(eq(fleetVehicles.id, input.id));
          return { success: true };
        } catch (error) {
          console.error("Fleet vehicle deletion error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete fleet vehicle",
          });
        }
      }),
  }),

  maintenancePlans: router({
    list: protectedProcedure
      .input(z.any().optional())
      .query(async ({ ctx }) => {
        try {
          return await ctx.db.query.maintenancePlans.findMany();
        } catch (error) {
          console.error("Maintenance plans list error:", error);
          return [];
        }
      }),

    create: protectedProcedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await ctx.db.insert(maintenancePlans).values({
            ...input,
            createdById: ctx.user!.userId,
            createdByName: ctx.user!.username,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return { success: true, id: result.insertId };
        } catch (error) {
          console.error("Maintenance plan creation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create maintenance plan",
          });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await ctx.db.delete(maintenancePlans).where(eq(maintenancePlans.id, input.id));
          return { success: true };
        } catch (error) {
          console.error("Maintenance plan deletion error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete maintenance plan",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

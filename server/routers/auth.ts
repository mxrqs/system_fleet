import { router, publicProcedure } from "./index";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { appUsers } from "../../drizzle/schema";
import {
  authenticateUser,
  hashPassword,
  throwAuthError,
  throwPermissionError,
} from "../_core/auth";

export const authRouter = router({
  /**
   * Login with username and password
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await authenticateUser(ctx.db, input.username, input.password);

      if (!result) {
        throwAuthError("Invalid username or password");
      }

      return {
        success: true,
        user: result.user,
        token: result.token,
      };
    }),

  /**
   * Get current user info
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    return {
      id: ctx.user.userId,
      username: ctx.user.username,
      role: ctx.user.role,
      empresa: ctx.user.empresa,
    };
  }),

  /**
   * Logout (client-side only, just clear token)
   */
  logout: publicProcedure.mutation(() => ({
    success: true,
  })),

  /**
   * Create a new user (admin only)
   */
  createUser: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: z.enum(["admin", "user", "estoquista"]),
        empresa: z.enum(["GP", "NP"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is authenticated and is admin
      if (!ctx.user) {
        throwAuthError("You must be logged in");
      }

      if (ctx.user.role !== "admin") {
        throwPermissionError("Only admins can create users");
      }

      // Check if username already exists
      const existingUser = await ctx.db.query.appUsers.findFirst({
        where: eq(appUsers.username, input.username),
      });

      if (existingUser) {
        throw new Error("Username already exists");
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create user
      const result = await ctx.db.insert(appUsers).values({
        username: input.username,
        passwordHash,
        role: input.role,
        empresa: input.empresa,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        userId: result.insertId,
      };
    }),

  /**
   * List all users (admin only)
   */
  listUsers: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throwAuthError("You must be logged in");
    }

    if (ctx.user.role !== "admin") {
      throwPermissionError("Only admins can list users");
    }

    const users = await ctx.db.query.appUsers.findMany({
      columns: {
        id: true,
        username: true,
        role: true,
        empresa: true,
        createdAt: true,
      },
    });

    return users;
  }),

  /**
   * Delete a user (admin only)
   */
  deleteUser: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throwAuthError("You must be logged in");
      }

      if (ctx.user.role !== "admin") {
        throwPermissionError("Only admins can delete users");
      }

      // Prevent deleting yourself
      if (input.id === ctx.user.userId) {
        throw new Error("You cannot delete your own account");
      }

      await ctx.db.delete(appUsers).where(eq(appUsers.id, input.id));

      return {
        success: true,
      };
    }),

  /**
   * Update user password
   */
  updatePassword: publicProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throwAuthError("You must be logged in");
      }

      // Get current user
      const user = await ctx.db.query.appUsers.findFirst({
        where: eq(appUsers.id, ctx.user.userId),
      });

      if (!user) {
        throwAuthError("User not found");
      }

      // Verify current password
      const { verifyPassword } = await import("../_core/auth");
      const passwordMatch = await verifyPassword(input.currentPassword, user.passwordHash);

      if (!passwordMatch) {
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const newPasswordHash = await hashPassword(input.newPassword);

      // Update password
      await ctx.db
        .update(appUsers)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(appUsers.id, ctx.user.userId));

      return {
        success: true,
      };
    }),
});

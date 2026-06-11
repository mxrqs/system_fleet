import { TRPCError } from "@trpc/server";
import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { Database } from "./db";
import { appUsers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface AuthContext {
  userId?: number;
  user?: {
    id: number;
    username: string;
    role: "admin" | "user" | "estoquista";
    empresa: "GP" | "NP";
  };
  db: Database;
}

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await hash(password, 10);
  return salt;
}

/**
 * Compare a password with its hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compare(password, hash);
}

/**
 * Create a JWT token
 */
export async function createToken(payload: {
  userId: number;
  username: string;
  role: string;
  empresa: string;
}): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(
  token: string
): Promise<{
  userId: number;
  username: string;
  role: string;
  empresa: string;
} | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as any;
  } catch (error) {
    return null;
  }
}

/**
 * Authenticate user with username and password
 */
export async function authenticateUser(
  db: Database,
  username: string,
  password: string
): Promise<{ user: any; token: string } | null> {
  try {
    const user = await db.query.appUsers.findFirst({
      where: eq(appUsers.username, username),
    });

    if (!user) {
      return null;
    }

    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      return null;
    }

    const token = await createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      empresa: user.empresa,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        empresa: user.empresa,
      },
      token,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

/**
 * Verify authentication token from request headers
 */
export async function verifyAuthToken(
  authHeader?: string
): Promise<{
  userId: number;
  username: string;
  role: string;
  empresa: string;
} | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

/**
 * Check if user has required role
 */
export function requireRole(
  userRole: string,
  requiredRoles: string[]
): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user has permission for a company
 */
export function hasCompanyAccess(
  userEmpresa: string,
  requiredEmpresa: string
): boolean {
  return userEmpresa === requiredEmpresa || userEmpresa === "admin";
}

/**
 * Throw authentication error
 */
export function throwAuthError(message: string = "Unauthorized"): never {
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message,
  });
}

/**
 * Throw permission error
 */
export function throwPermissionError(
  message: string = "You do not have permission to perform this action"
): never {
  throw new TRPCError({
    code: "FORBIDDEN",
    message,
  });
}

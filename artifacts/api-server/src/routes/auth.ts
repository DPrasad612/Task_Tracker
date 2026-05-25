import { Router } from "express";
import { db, usersTable, preferencesTable, tasksTable, progressLogsTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, verifyToken } from "../lib/auth";
import { formatDate } from "../lib/utils";
import { logger } from "../lib/logger";
import crypto from "node:crypto";

const router = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Missing required fields: email, password" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const [preferences] = await db
      .select()
      .from(preferencesTable)
      .where(eq(preferencesTable.userId, user.id));

    const token = signToken({ userId: user.id, email: user.email });

    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 * 1000,
      path: "/",
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: preferences || null,
      },
    });
  } catch (error) {
    req.log.error({ error }, "Login error");
    res.status(500).json({ error: "Internal server error during login" });
  }
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Missing required fields: name, email, password" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail));

    if (existing) {
      res.status(400).json({ error: "A user with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db.insert(usersTable).values({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    }).returning();

    const [preferences] = await db.insert(preferencesTable).values({
      userId: user.id,
      theme: "light",
      workWeek: "mon-sun",
    }).returning();

    const token = signToken({ userId: user.id, email: user.email });

    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 * 1000,
      path: "/",
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences,
      },
    });
  } catch (error) {
    req.log.error({ error }, "Signup error");
    res.status(500).json({ error: "Internal server error during signup" });
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  try {
    const token = req.cookies?.session;
    if (!token) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId));

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const [preferences] = await db
      .select()
      .from(preferencesTable)
      .where(eq(preferencesTable.userId, user.id));

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: preferences || null,
      },
    });
  } catch (error) {
    req.log.error({ error }, "Session check error");
    res.status(500).json({ error: "Internal server error checking session" });
  }
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email address is required" });
      return;
    }
    const normalizedEmail = email.toLowerCase().trim();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));

    if (!user) {
      res.json({ message: "If that email is registered, a reset link has been generated." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokensTable).values({ userId: user.id, token, expiresAt });

    const baseUrl = process.env["REPLIT_DEV_DOMAIN"]
      ? `https://${process.env["REPLIT_DEV_DOMAIN"]}`
      : `http://localhost:${process.env["PORT"] ?? 8080}`;

    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    res.json({ message: "Reset link generated.", resetLink });
  } catch (error) {
    req.log.error({ error }, "Forgot password error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/reset-password/validate", async (req, res): Promise<void> => {
  try {
    const { token } = req.query as { token?: string };
    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }
    const [row] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.token, token),
          gt(passwordResetTokensTable.expiresAt, new Date()),
          isNull(passwordResetTokensTable.usedAt),
        ),
      );
    if (!row) {
      res.status(404).json({ error: "Invalid or expired token" });
      return;
    }
    res.json({ valid: true });
  } catch (error) {
    req.log.error({ error }, "Token validation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: "Token and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    const [row] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.token, token),
          gt(passwordResetTokensTable.expiresAt, new Date()),
          isNull(passwordResetTokensTable.usedAt),
        ),
      );
    if (!row) {
      res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
      return;
    }

    const passwordHash = await hashPassword(password);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, row.userId));
    await db.update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, row.id));

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    req.log.error({ error }, "Reset password error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  res.cookie("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;

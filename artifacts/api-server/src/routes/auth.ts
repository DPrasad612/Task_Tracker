import { Router } from "express";
import { db, usersTable, preferencesTable, tasksTable, progressLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, verifyToken } from "../lib/auth";
import { formatDate } from "../lib/utils";
import { logger } from "../lib/logger";

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

    // FTUX Seeding
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    const twoDaysAgo = formatDate(new Date(Date.now() - 172800000));

    const seedTasks = [
      { name: "Wake Up On Time", category: "General", color: "#3B82F6", priority: "high", order: 0 },
      { name: "Drink Water", category: "Health", color: "#10B981", priority: "medium", order: 1 },
      { name: "Deep Work (1 Hr)", category: "Work", color: "#F59E0B", priority: "high", order: 2 },
      { name: "Read 10 Minutes", category: "Personal", color: "#EC4899", priority: "low", order: 3 },
    ];

    for (const t of seedTasks) {
      const [createdTask] = await db.insert(tasksTable).values({
        userId: user.id,
        name: t.name,
        category: t.category,
        color: t.color,
        priority: t.priority,
        order: t.order,
      }).returning();

      if (t.name === "Wake Up On Time" || t.name === "Drink Water") {
        await db.insert(progressLogsTable).values([
          { userId: user.id, taskId: createdTask.id, date: twoDaysAgo, completed: true },
          { userId: user.id, taskId: createdTask.id, date: yesterday, completed: true },
          { userId: user.id, taskId: createdTask.id, date: today, completed: true },
        ]);
      }
    }

    const [parentTask] = await db.insert(tasksTable).values({
      userId: user.id,
      name: "Learn Data Structures",
      category: "Study",
      color: "#8B5CF6",
      priority: "high",
      order: 4,
    }).returning();

    const subtaskNames = ["Arrays", "Linked Lists", "Trees"];
    for (let i = 0; i < subtaskNames.length; i++) {
      const [sub] = await db.insert(tasksTable).values({
        userId: user.id,
        name: subtaskNames[i],
        category: "Study",
        color: "#8B5CF6",
        priority: "high",
        parentId: parentTask.id,
        order: i,
      }).returning();

      if (subtaskNames[i] === "Arrays") {
        await db.insert(progressLogsTable).values([
          { userId: user.id, taskId: sub.id, date: yesterday, completed: true },
          { userId: user.id, taskId: sub.id, date: today, completed: true },
        ]);
      } else if (subtaskNames[i] === "Linked Lists") {
        await db.insert(progressLogsTable).values([
          { userId: user.id, taskId: sub.id, date: yesterday, completed: true },
        ]);
      }
    }

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

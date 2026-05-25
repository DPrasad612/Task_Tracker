import { Router } from "express";
import { db, usersTable, tasksTable, progressLogsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { verifyToken } from "../lib/auth";
import { buildTaskTree } from "../lib/utils";

const router = Router();

async function getSessionUser(req: any) {
  const token = req.cookies?.session;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, decoded.userId));

  return user || null;
}

router.get("/tasks", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    if (!startDate || !endDate) {
      res.status(400).json({ error: "Missing startDate or endDate query parameters" });
      return;
    }

    const tasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, user.id))
      .orderBy(tasksTable.order);

    const logs = await db
      .select()
      .from(progressLogsTable)
      .where(
        and(
          eq(progressLogsTable.userId, user.id),
          gte(progressLogsTable.date, startDate),
          lte(progressLogsTable.date, endDate)
        )
      );

    const taskTree = buildTaskTree(tasks, logs);

    res.json({ tasks: taskTree });
  } catch (error) {
    req.log.error({ error }, "GET tasks error");
    res.status(500).json({ error: "Internal server error fetching tasks" });
  }
});

router.post("/tasks", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { name, category, color, icon, priority, parentId, startDate, endDate, scheduledTime, scheduledNote } = req.body;

    if (!name) {
      res.status(400).json({ error: "Task name is required" });
      return;
    }

    const existingTasks = await db
      .select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.userId, user.id),
          parentId ? eq(tasksTable.parentId, parentId) : eq(tasksTable.parentId, null as any)
        )
      );

    const [task] = await db.insert(tasksTable).values({
      userId: user.id,
      name: name.trim(),
      category: category || "General",
      color: color || "#3B82F6",
      icon: icon || "Check",
      priority: priority || "medium",
      parentId: parentId || null,
      isSample: false,
      order: existingTasks.length,
      startDate: startDate || null,
      endDate: endDate || null,
      scheduledTime: scheduledTime || null,
      scheduledNote: scheduledNote || null,
    }).returning();

    res.json({ task: { ...task, subtasks: [], progressLogs: [] } });
  } catch (error) {
    req.log.error({ error }, "POST task error");
    res.status(500).json({ error: "Internal server error creating task" });
  }
});

router.put("/tasks/:id", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, category, color, icon, priority, startDate, endDate, scheduledTime, scheduledNote } = req.body;

    const [existing] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, rawId));

    if (!existing || existing.userId !== user.id) {
      res.status(404).json({ error: "Task not found or unauthorized" });
      return;
    }

    const [updated] = await db
      .update(tasksTable)
      .set({
        name: name !== undefined ? name.trim() : existing.name,
        category: category !== undefined ? category : existing.category,
        color: color !== undefined ? color : existing.color,
        icon: icon !== undefined ? icon : existing.icon,
        priority: priority !== undefined ? priority : existing.priority,
        startDate: startDate !== undefined ? (startDate || null) : existing.startDate,
        endDate: endDate !== undefined ? (endDate || null) : existing.endDate,
        scheduledTime: scheduledTime !== undefined ? (scheduledTime || null) : existing.scheduledTime,
        scheduledNote: scheduledNote !== undefined ? (scheduledNote || null) : existing.scheduledNote,
        isSample: false,
      })
      .where(eq(tasksTable.id, rawId))
      .returning();

    res.json({ task: updated });
  } catch (error) {
    req.log.error({ error }, "PUT task error");
    res.status(500).json({ error: "Internal server error updating task" });
  }
});

router.delete("/tasks/all", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const allTasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, user.id));

    for (const task of allTasks) {
      await db.delete(progressLogsTable).where(eq(progressLogsTable.taskId, task.id));
    }
    await db.delete(tasksTable).where(eq(tasksTable.userId, user.id));

    res.json({ success: true, message: "All tasks deleted" });
  } catch (error) {
    req.log.error({ error }, "Delete all tasks error");
    res.status(500).json({ error: "Internal server error deleting all tasks" });
  }
});

router.delete("/tasks/sample", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const sampleTasks = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.userId, user.id), eq(tasksTable.isSample, true)));

    for (const task of sampleTasks) {
      await db.delete(progressLogsTable).where(eq(progressLogsTable.taskId, task.id));
    }
    await db.delete(tasksTable).where(and(eq(tasksTable.userId, user.id), eq(tasksTable.isSample, true)));

    res.json({ success: true, message: "Sample tasks cleared" });
  } catch (error) {
    req.log.error({ error }, "Delete sample tasks error");
    res.status(500).json({ error: "Internal server error clearing sample tasks" });
  }
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const [existing] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, rawId));

    if (!existing || existing.userId !== user.id) {
      res.status(404).json({ error: "Task not found or unauthorized" });
      return;
    }

    async function deleteTaskRecursive(taskId: string) {
      const subtasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.parentId, taskId));

      for (const sub of subtasks) {
        await deleteTaskRecursive(sub.id);
      }

      await db.delete(progressLogsTable).where(eq(progressLogsTable.taskId, taskId));
      await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
    }

    await deleteTaskRecursive(rawId);

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    req.log.error({ error }, "DELETE task error");
    res.status(500).json({ error: "Internal server error deleting task" });
  }
});

router.post("/tasks/reorder", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { orderedTaskIds } = req.body;

    if (!orderedTaskIds || !Array.isArray(orderedTaskIds)) {
      res.status(400).json({ error: "Missing or invalid orderedTaskIds array" });
      return;
    }

    for (let i = 0; i < orderedTaskIds.length; i++) {
      await db
        .update(tasksTable)
        .set({ order: i })
        .where(and(eq(tasksTable.id, orderedTaskIds[i]), eq(tasksTable.userId, user.id)));
    }

    res.json({ success: true, message: "Tasks reordered successfully" });
  } catch (error) {
    req.log.error({ error }, "Reorder tasks error");
    res.status(500).json({ error: "Internal server error reordering tasks" });
  }
});

router.post("/tasks/seed", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const fmt = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const now = Date.now();
    const today = fmt(new Date());
    const yesterday = fmt(new Date(now - 86400000));
    const twoDaysAgo = fmt(new Date(now - 172800000));
    const threeDaysAgo = fmt(new Date(now - 259200000));
    const in3Days = fmt(new Date(now + 259200000));
    const in14Days = fmt(new Date(now + 1209600000));
    const in30Days = fmt(new Date(now + 2592000000));
    const ago7 = fmt(new Date(now - 604800000));
    const ago5 = fmt(new Date(now - 432000000));
    const ago2 = fmt(new Date(now - 172800000));

    const existingTasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, user.id));

    const offset = existingTasks.length;

    const seedTasks = [
      {
        name: "Wake Up On Time",
        category: "General",
        color: "#3B82F6",
        priority: "high" as const,
        order: offset + 0,
        startDate: ago7,
        endDate: in30Days,
        scheduledTime: "07:00",
        scheduledNote: "No snooze allowed",
      },
      {
        name: "Drink Water (8 Glasses)",
        category: "Health",
        color: "#10B981",
        priority: "medium" as const,
        order: offset + 1,
        startDate: ago5,
        endDate: null,
        scheduledTime: null,
        scheduledNote: null,
      },
      {
        name: "Deep Work Session",
        category: "Work",
        color: "#F59E0B",
        priority: "high" as const,
        order: offset + 2,
        startDate: today,
        endDate: in14Days,
        scheduledTime: "09:00",
        scheduledNote: "No distractions — phone away",
      },
      {
        name: "Read 10 Minutes",
        category: "Personal",
        color: "#EC4899",
        priority: "low" as const,
        order: offset + 3,
        startDate: in3Days,
        endDate: in30Days,
        scheduledTime: "21:00",
        scheduledNote: "Before bed reading habit",
      },
    ];

    for (const t of seedTasks) {
      const [createdTask] = await db.insert(tasksTable).values({
        userId: user.id,
        name: t.name,
        category: t.category,
        color: t.color,
        priority: t.priority,
        order: t.order,
        isSample: true,
        startDate: t.startDate,
        endDate: t.endDate,
        scheduledTime: t.scheduledTime,
        scheduledNote: t.scheduledNote,
      }).returning();

      if (t.name === "Wake Up On Time") {
        await db.insert(progressLogsTable).values([
          { userId: user.id, taskId: createdTask.id, date: threeDaysAgo, completed: true },
          { userId: user.id, taskId: createdTask.id, date: twoDaysAgo, completed: true },
          { userId: user.id, taskId: createdTask.id, date: yesterday, completed: true },
          { userId: user.id, taskId: createdTask.id, date: today, completed: true },
        ]);
      } else if (t.name === "Drink Water (8 Glasses)") {
        await db.insert(progressLogsTable).values([
          { userId: user.id, taskId: createdTask.id, date: twoDaysAgo, completed: true },
          { userId: user.id, taskId: createdTask.id, date: yesterday, completed: true },
        ]);
      } else if (t.name === "Deep Work Session") {
        await db.insert(progressLogsTable).values([
          { userId: user.id, taskId: createdTask.id, date: today, completed: false },
        ]);
      }
    }

    const [parentTask] = await db.insert(tasksTable).values({
      userId: user.id,
      name: "Learn Data Structures",
      category: "Study",
      color: "#8B5CF6",
      priority: "high",
      order: offset + 4,
      isSample: true,
      startDate: ago2,
      endDate: in14Days,
      scheduledTime: "19:00",
      scheduledNote: "Complete 2 Leetcode problems",
    }).returning();

    const subtaskNames = ["Arrays & Hashing", "Linked Lists", "Binary Trees"];
    for (let i = 0; i < subtaskNames.length; i++) {
      const [sub] = await db.insert(tasksTable).values({
        userId: user.id,
        name: subtaskNames[i],
        category: "Study",
        color: "#8B5CF6",
        priority: "high",
        parentId: parentTask.id,
        order: i,
        isSample: true,
      }).returning();

      if (subtaskNames[i] === "Arrays & Hashing") {
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

    res.json({ success: true, message: "Sample tasks loaded" });
  } catch (error) {
    req.log.error({ error }, "Seed tasks error");
    res.status(500).json({ error: "Internal server error seeding tasks" });
  }
});

export default router;

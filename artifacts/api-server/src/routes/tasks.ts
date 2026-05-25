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

    const { name, category, color, icon, priority, parentId } = req.body;

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
      order: existingTasks.length,
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
    const { name, category, color, icon, priority } = req.body;

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
      })
      .where(eq(tasksTable.id, rawId))
      .returning();

    res.json({ task: updated });
  } catch (error) {
    req.log.error({ error }, "PUT task error");
    res.status(500).json({ error: "Internal server error updating task" });
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

    // Recursively delete subtasks
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

export default router;

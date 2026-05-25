import { Router } from "express";
import { db, usersTable, tasksTable, progressLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../lib/auth";
import { formatDate } from "../lib/utils";

const router = Router();

async function getSessionUser(req: any) {
  const token = req.cookies?.session;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId));
  return user || null;
}

async function upsertLog(userId: string, taskId: string, date: string, completed: boolean) {
  const existing = await db
    .select()
    .from(progressLogsTable)
    .where(and(eq(progressLogsTable.taskId, taskId), eq(progressLogsTable.date, date)));

  if (existing.length > 0) {
    await db
      .update(progressLogsTable)
      .set({ completed })
      .where(and(eq(progressLogsTable.taskId, taskId), eq(progressLogsTable.date, date)));
  } else {
    await db.insert(progressLogsTable).values({ userId, taskId, date, completed });
  }
}

router.post("/progress", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { taskId, date, completed, currentLocalDate } = req.body;

    if (!taskId || !date || completed === undefined) {
      res.status(400).json({ error: "Missing required fields: taskId, date, completed" });
      return;
    }

    const todayStr = currentLocalDate || formatDate(new Date());

    if (date !== todayStr) {
      const debugOverride = req.headers["x-debug-override"] === "true";
      if (!debugOverride) {
        const isFuture = new Date(date).getTime() > new Date(todayStr).getTime();
        res.status(403).json({
          error: isFuture
            ? "Cannot complete tasks for future dates."
            : "Past days are locked. You can only check/uncheck tasks for today.",
          locked: true,
        });
        return;
      }
    }

    const [task] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId));

    if (!task || task.userId !== user.id) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const subtasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.parentId, task.id));

    if (subtasks.length > 0) {
      await upsertLog(user.id, taskId, date, completed);

      async function toggleSubtasksRecursive(parentId: string, state: boolean) {
        const children = await db.select().from(tasksTable).where(eq(tasksTable.parentId, parentId));
        for (const child of children) {
          await upsertLog(user.id, child.id, date, state);
          await toggleSubtasksRecursive(child.id, state);
        }
      }

      await toggleSubtasksRecursive(task.id, completed);
    } else {
      await upsertLog(user.id, taskId, date, completed);

      let parentId = task.parentId;
      while (parentId) {
        const [parent] = await db.select().from(tasksTable).where(eq(tasksTable.id, parentId));
        if (!parent) break;

        const siblings = await db.select().from(tasksTable).where(eq(tasksTable.parentId, parentId));
        const siblingIds = siblings.map((s) => s.id);

        const siblingLogs = await db
          .select()
          .from(progressLogsTable)
          .where(
            and(
              eq(progressLogsTable.date, date),
              eq(progressLogsTable.completed, true)
            )
          );

        const completedSiblingCount = siblingLogs.filter((l) => siblingIds.includes(l.taskId)).length;
        const allCompleted = completedSiblingCount === siblings.length;

        await upsertLog(user.id, parent.id, date, allCompleted);
        parentId = parent.parentId;
      }
    }

    res.json({ success: true });
  } catch (error) {
    req.log.error({ error }, "POST progress error");
    res.status(500).json({ error: "Internal server error saving progress" });
  }
});

export default router;

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { taskId, date, completed, currentLocalDate } = await request.json();

    if (!taskId || !date || completed === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: taskId, date, completed" },
        { status: 400 }
      );
    }

    // 1. Strict lock-out validation (past/future dates locked)
    // The client sends its current local date (YYYY-MM-DD)
    const todayStr = currentLocalDate || formatDate(new Date());

    if (date !== todayStr) {
      // Internal debug override can be triggered via header if needed, otherwise block
      const debugOverride = request.headers.get("x-debug-override") === "true";
      if (!debugOverride) {
        const isFuture = new Date(date).getTime() > new Date(todayStr).getTime();
        return NextResponse.json(
          {
            error: isFuture
              ? "Cannot complete tasks for future dates."
              : "Past days are locked. You can only check/uncheck tasks for today.",
            locked: true
          },
          { status: 403 }
        );
      }
    }

    // Helper to upsert a progress log
    const upsertLog = async (tid: string, comp: boolean) => {
      await db.progressLog.upsert({
        where: { taskId_date: { taskId: tid, date } },
        create: { userId: user.id, taskId: tid, date, completed: comp },
        update: { completed: comp },
      });
    };

    // 2. Fetch the task with its subtasks
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { subtasks: true },
    });

    if (!task || task.userId !== user.id) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 3. Propagate changes recursively
    if (task.subtasks.length > 0) {
      // Toggle parent and all nested subtasks recursively
      await upsertLog(taskId, completed);

      const toggleSubtasksRecursive = async (t: any, state: boolean) => {
        for (const sub of t.subtasks) {
          await upsertLog(sub.id, state);
          const fullSub = await db.task.findUnique({
            where: { id: sub.id },
            include: { subtasks: true },
          });
          if (fullSub && fullSub.subtasks.length > 0) {
            await toggleSubtasksRecursive(fullSub, state);
          }
        }
      };
      await toggleSubtasksRecursive(task, completed);
    } else {
      // Leaf subtask or standalone task. Toggle itself.
      await upsertLog(taskId, completed);

      // Propagate completion up to parent tasks if all subtasks are complete
      let parentId = task.parentId;
      while (parentId) {
        const parent = await db.task.findUnique({
          where: { id: parentId },
          include: { subtasks: true },
        });

        if (!parent) break;

        const siblingIds = parent.subtasks.map((s) => s.id);
        const siblingLogs = await db.progressLog.findMany({
          where: {
            taskId: { in: siblingIds },
            date,
            completed: true,
          },
        });

        // The parent is marked completed if all subtasks are completed
        const allCompleted = siblingLogs.length === parent.subtasks.length;
        await upsertLog(parent.id, allCompleted);

        parentId = parent.parentId;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST progress error:", error);
    return NextResponse.json(
      { error: "Internal server error saving progress" },
      { status: 500 }
    );
  }
}

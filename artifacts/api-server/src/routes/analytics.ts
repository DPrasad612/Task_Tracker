import { Router } from "express";
import { db, usersTable, tasksTable, progressLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";
import { formatDate, calculateStreak } from "../lib/utils";

const router = Router();

async function getSessionUser(req: any) {
  const token = req.cookies?.session;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId));
  return user || null;
}

router.get("/analytics", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const todayStr = formatDate(new Date());

    const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, user.id));

    const allLogs = await db
      .select()
      .from(progressLogsTable)
      .where(eq(progressLogsTable.userId, user.id))
      .orderBy(progressLogsTable.date);

    const allLogsSorted = allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const currentStreak = calculateStreak(allLogsSorted);

    const rootTasks = tasks.filter((t) => t.parentId === null);
    const totalRootCount = rootTasks.length;

    const todayLogs = allLogsSorted.filter((l) => l.date === todayStr && l.completed);
    const completedTodayCount = todayLogs.filter((log) => {
      const task = tasks.find((t) => t.id === log.taskId);
      return task && task.parentId === null;
    }).length;

    const todayProgress = totalRootCount > 0 ? Math.round((completedTodayCount / totalRootCount) * 100) : 0;

    const weeklyData = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const dayName = dayNames[d.getDay()];

      const dayLogs = allLogsSorted.filter((l) => l.date === dateStr && l.completed);
      const completedCount = dayLogs.filter((log) => {
        const t = tasks.find((x) => x.id === log.taskId);
        return t && t.parentId === null;
      }).length;

      weeklyData.push({
        day: dayName,
        date: dateStr,
        completed: completedCount,
        total: totalRootCount,
        rate: totalRootCount > 0 ? Math.round((completedCount / totalRootCount) * 100) : 0,
      });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
    const sixMonthsAgoStr = formatDate(sixMonthsAgo);

    const heatmapLogs = allLogsSorted.filter((l) => l.date >= sixMonthsAgoStr && l.completed);
    const heatmapDataMap: { [date: string]: number } = {};

    heatmapLogs.forEach((log) => {
      const t = tasks.find((x) => x.id === log.taskId);
      if (t && t.parentId === null) {
        heatmapDataMap[log.date] = (heatmapDataMap[log.date] || 0) + 1;
      }
    });

    const heatmapData = Object.entries(heatmapDataMap).map(([date, count]) => ({ date, count }));

    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    const completedLogs = allLogsSorted.filter((l) => l.completed);
    completedLogs.forEach((log) => {
      const t = tasks.find((x) => x.id === log.taskId);
      if (t && t.parentId === null) {
        const dateObj = new Date(log.date + "T12:00:00");
        weekdayCounts[dateObj.getDay()]++;
      }
    });

    let maxCount = -1;
    let mostProductiveDayIndex = 1;
    weekdayCounts.forEach((count, index) => {
      if (count > maxCount) {
        maxCount = count;
        mostProductiveDayIndex = index;
      }
    });

    const weekdayFullNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const mostProductiveDay = maxCount > 0 ? weekdayFullNames[mostProductiveDayIndex] : "None yet";

    const priorityStats = {
      low: tasks.filter((t) => t.priority === "low" && t.parentId === null).length,
      medium: tasks.filter((t) => t.priority === "medium" && t.parentId === null).length,
      high: tasks.filter((t) => t.priority === "high" && t.parentId === null).length,
    };

    const categoryStatsMap: { [category: string]: number } = {};
    tasks.filter((t) => t.parentId === null).forEach((t) => {
      categoryStatsMap[t.category] = (categoryStatsMap[t.category] || 0) + 1;
    });
    const categoryStats = Object.entries(categoryStatsMap).map(([name, value]) => ({ name, value }));

    let insight = "Add some tasks and complete them to start tracking your progress!";
    if (totalRootCount > 0) {
      if (todayProgress === 100) {
        insight = "Perfect day! You completed all of your target tasks. Fantastic job!";
      } else if (todayProgress >= 75) {
        insight = "Almost there! Just a few more checkmarks to clear today's list. Finish strong!";
      } else if (todayProgress >= 50) {
        insight = "Halfway done! Keep taking small steps, consistency is key.";
      } else if (todayProgress > 0) {
        insight = "Good start! Keep chipping away at your tasks.";
      } else if (currentStreak > 2) {
        insight = `You're on a ${currentStreak}-day streak! Don't break the chain.`;
      } else {
        insight = "Focus on completing just one task to build momentum.";
      }
    }

    res.json({
      todayProgress,
      completedToday: completedTodayCount,
      totalToday: totalRootCount,
      currentStreak,
      weeklyData,
      heatmapData,
      mostProductiveDay,
      priorityStats,
      categoryStats,
      insight,
    });
  } catch (error) {
    req.log.error({ error }, "GET analytics error");
    res.status(500).json({ error: "Internal server error fetching analytics" });
  }
});

export default router;

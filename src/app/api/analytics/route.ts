import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, calculateStreak } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const todayStr = formatDate(new Date());

    // 1. Fetch all tasks to compute category/priority statistics
    const tasks = await db.task.findMany({
      where: { userId: user.id },
    });

    // 2. Fetch progress logs for streak calculation (all logs)
    const allLogs = await db.progressLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    // Calculate current streak
    const currentStreak = calculateStreak(allLogs);

    // 3. Today's progress details
    // Find all leaf tasks (tasks without subtasks) or parent tasks that act as units of work
    // In our UI, parent tasks auto-calculate or are units. Let's look at all tasks that have parentId === null (root tasks)
    const rootTasks = tasks.filter((t) => t.parentId === null);
    const totalRootCount = rootTasks.length;

    const todayLogs = allLogs.filter((l) => l.date === todayStr && l.completed);
    // Map today completed logs to root tasks or subtasks
    const completedTodayCount = todayLogs.filter(log => {
      // Is this task a root task?
      const isRoot = rootTasks.some(t => t.id === log.taskId);
      // Or is it a leaf subtask whose parent is not completed yet?
      // For simplicity, count how many root level items are completed today
      const task = tasks.find(t => t.id === log.taskId);
      return task && task.parentId === null;
    }).length;

    const todayProgress = totalRootCount > 0 ? Math.round((completedTodayCount / totalRootCount) * 100) : 0;

    // 4. Weekly completion graph (last 7 days)
    const weeklyData = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const dayName = dayNames[d.getDay()];

      const dayLogs = allLogs.filter((l) => l.date === dateStr && l.completed);
      // Count completed root tasks on that day
      const completedCount = dayLogs.filter(log => {
        const t = tasks.find(x => x.id === log.taskId);
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

    // 5. Heatmap (last 180 days)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
    const sixMonthsAgoStr = formatDate(sixMonthsAgo);

    const heatmapLogs = allLogs.filter((l) => l.date >= sixMonthsAgoStr && l.completed);
    const heatmapDataMap: { [date: string]: number } = {};

    heatmapLogs.forEach((log) => {
      const t = tasks.find(x => x.id === log.taskId);
      // Count completions of root tasks
      if (t && t.parentId === null) {
        heatmapDataMap[log.date] = (heatmapDataMap[log.date] || 0) + 1;
      }
    });

    const heatmapData = Object.entries(heatmapDataMap).map(([date, count]) => ({
      date,
      count,
    }));

    // 6. Most productive day calculation
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
    const completedLogs = allLogs.filter((l) => l.completed);
    completedLogs.forEach((log) => {
      const t = tasks.find(x => x.id === log.taskId);
      if (t && t.parentId === null) {
        const dateObj = new Date(log.date + "T12:00:00");
        weekdayCounts[dateObj.getDay()]++;
      }
    });

    let maxCount = -1;
    let mostProductiveDayIndex = 1; // Default to Mon
    weekdayCounts.forEach((count, index) => {
      if (count > maxCount) {
        maxCount = count;
        mostProductiveDayIndex = index;
      }
    });
    const weekdayFullNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const mostProductiveDay = maxCount > 0 ? weekdayFullNames[mostProductiveDayIndex] : "None yet";

    // 7. Task statistics (Priority & Category)
    const priorityStats = {
      low: tasks.filter((t) => t.priority === "low" && t.parentId === null).length,
      medium: tasks.filter((t) => t.priority === "medium" && t.parentId === null).length,
      high: tasks.filter((t) => t.priority === "high" && t.parentId === null).length,
    };

    const categoryStatsMap: { [category: string]: number } = {};
    tasks.filter(t => t.parentId === null).forEach((t) => {
      categoryStatsMap[t.category] = (categoryStatsMap[t.category] || 0) + 1;
    });
    const categoryStats = Object.entries(categoryStatsMap).map(([name, value]) => ({
      name,
      value,
    }));

    // 8. Motivational Insights
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

    return NextResponse.json({
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
  } catch (error: any) {
    console.error("GET analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching analytics" },
      { status: 500 }
    );
  }
}

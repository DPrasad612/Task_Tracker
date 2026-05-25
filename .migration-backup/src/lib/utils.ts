import { Task, ProgressLog, TaskWithDetails } from "@/types";

/**
 * Formats a Date object to YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns an array of 7 days representing the week containing the pivot date (Mon-Sun).
 */
export function getWeekDates(pivotDate: Date, startOfWeek: "sun" | "mon" = "mon") {
  const dates = [];
  const currentDay = pivotDate.getDay(); // 0 is Sunday, 1 is Monday...

  let distance = 0;
  if (startOfWeek === "mon") {
    // Distance from Monday (1)
    distance = currentDay === 0 ? -6 : 1 - currentDay;
  } else {
    // Distance from Sunday (0)
    distance = -currentDay;
  }

  const startOfWeekDate = new Date(pivotDate);
  startOfWeekDate.setDate(pivotDate.getDate() + distance);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeekDate);
    d.setDate(startOfWeekDate.getDate() + i);
    const dayIndex = d.getDay();
    dates.push({
      dayName: dayNames[dayIndex],
      dateStr: formatDate(d),
      dateNum: d.getDate(),
      dayIndex,
    });
  }

  return dates;
}

/**
 * Builds a recursively nested task tree from a flat list of tasks and logs.
 */
export function buildTaskTree(tasks: any[], logs: ProgressLog[]): TaskWithDetails[] {
  const taskMap: { [id: string]: TaskWithDetails } = {};

  // Initialize nodes in map
  tasks.forEach((task) => {
    taskMap[task.id] = {
      ...task,
      subtasks: [],
      progressLogs: logs.filter((log) => log.taskId === task.id),
    };
  });

  const roots: TaskWithDetails[] = [];

  // Group by parent-child
  tasks.forEach((task) => {
    const node = taskMap[task.id];
    if (task.parentId) {
      const parent = taskMap[task.parentId];
      if (parent) {
        parent.subtasks.push(node);
      } else {
        // Parent doesn't exist, treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // Sort function to order items by the 'order' field ascending
  const sortTree = (nodes: TaskWithDetails[]): TaskWithDetails[] => {
    return nodes
      .sort((a, b) => a.order - b.order)
      .map((node) => {
        if (node.subtasks.length > 0) {
          node.subtasks = sortTree(node.subtasks);
        }
        return node;
      });
  };

  return sortTree(roots);
}

/**
 * Calculates current streak for a user
 */
export function calculateStreak(logs: ProgressLog[]): number {
  const completedDates = Array.from(
    new Set(
      logs
        .filter((log) => log.completed)
        .map((log) => log.date)
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // descending (newest first)

  if (completedDates.length === 0) return 0;

  // Let's count consecutive days starting from today or yesterday
  const todayStr = formatDate(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  // Check if they completed a task today or yesterday
  const firstCompleted = completedDates[0];
  if (firstCompleted !== todayStr && firstCompleted !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let expectedDate = new Date(firstCompleted);

  for (let i = 0; i < completedDates.length; i++) {
    const dateStr = completedDates[i];
    const actualDate = new Date(dateStr + "T12:00:00");
    const expectedStr = formatDate(expectedDate);

    if (dateStr === expectedStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1); // move back one day
    } else {
      break;
    }
  }

  return streak;
}

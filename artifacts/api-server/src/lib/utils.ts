export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function buildTaskTree(tasks: any[], logs: any[]): any[] {
  const taskMap: { [id: string]: any } = {};

  tasks.forEach((task) => {
    taskMap[task.id] = {
      ...task,
      subtasks: [],
      progressLogs: logs.filter((log) => log.taskId === task.id),
    };
  });

  const roots: any[] = [];

  tasks.forEach((task) => {
    const node = taskMap[task.id];
    if (task.parentId) {
      const parent = taskMap[task.parentId];
      if (parent) {
        parent.subtasks.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  const sortTree = (nodes: any[]): any[] => {
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

export function calculateStreak(logs: any[]): number {
  const completedDates = Array.from(
    new Set(
      logs
        .filter((log) => log.completed)
        .map((log) => log.date)
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (completedDates.length === 0) return 0;

  const todayStr = formatDate(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  const firstCompleted = completedDates[0];
  if (firstCompleted !== todayStr && firstCompleted !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  const expectedDate = new Date(firstCompleted);

  for (let i = 0; i < completedDates.length; i++) {
    const dateStr = completedDates[i];
    const expectedStr = formatDate(expectedDate);

    if (dateStr === expectedStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

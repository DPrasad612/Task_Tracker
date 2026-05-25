export interface Preference {
  id: string;
  userId: string;
  theme: string;
  workWeek: string;
}

export interface ProgressLog {
  id: string;
  userId: string;
  taskId: string;
  date: string;
  completed: boolean;
  createdAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  name: string;
  category: string;
  color: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  order: number;
  parentId: string | null;
  createdAt: Date;
}

export interface TaskWithDetails extends Task {
  subtasks: TaskWithDetails[];
  progressLogs: ProgressLog[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  preferences?: Preference | null;
}

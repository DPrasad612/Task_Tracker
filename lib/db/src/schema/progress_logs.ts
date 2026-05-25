import { pgTable, text, uuid, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";
import { tasksTable } from "./tasks";

export const progressLogsTable = pgTable("progress_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("progress_logs_task_date_unique").on(table.taskId, table.date),
]);

export const insertProgressLogSchema = createInsertSchema(progressLogsTable).omit({ id: true, createdAt: true });
export type InsertProgressLog = z.infer<typeof insertProgressLogSchema>;
export type ProgressLog = typeof progressLogsTable.$inferSelect;

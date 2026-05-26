import { pgTable, text, uuid, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const tasksTable = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("General"),
  color: text("color").notNull().default("#3B82F6"),
  icon: text("icon").notNull().default("Check"),
  priority: text("priority").notNull().default("medium"),
  order: integer("order").notNull().default(0),
  parentId: uuid("parent_id"),
  isSample: boolean("is_sample").notNull().default(false),
  isWeekBased: boolean("is_week_based").notNull().default(false),
  weekDays: text("week_days"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  scheduledTime: text("scheduled_time"),
  scheduledNote: text("scheduled_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;

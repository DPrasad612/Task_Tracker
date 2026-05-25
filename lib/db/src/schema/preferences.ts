import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const preferencesTable = pgTable("preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("light"),
  workWeek: text("work_week").notNull().default("mon-sun"),
});

export const insertPreferenceSchema = createInsertSchema(preferencesTable).omit({ id: true });
export type InsertPreference = z.infer<typeof insertPreferenceSchema>;
export type Preference = typeof preferencesTable.$inferSelect;

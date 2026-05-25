import { Router } from "express";
import { db, usersTable, preferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";

const router = Router();

async function getSessionUser(req: any) {
  const token = req.cookies?.session;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId));
  return user || null;
}

router.post("/preferences", async (req, res): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { theme, workWeek } = req.body;

    const existing = await db
      .select()
      .from(preferencesTable)
      .where(eq(preferencesTable.userId, user.id));

    let preferences;
    if (existing.length > 0) {
      const [updated] = await db
        .update(preferencesTable)
        .set({
          theme: theme !== undefined ? theme : existing[0].theme,
          workWeek: workWeek !== undefined ? workWeek : existing[0].workWeek,
        })
        .where(eq(preferencesTable.userId, user.id))
        .returning();
      preferences = updated;
    } else {
      const [created] = await db.insert(preferencesTable).values({
        userId: user.id,
        theme: theme || "light",
        workWeek: workWeek || "mon-sun",
      }).returning();
      preferences = created;
    }

    res.json({ preferences });
  } catch (error) {
    req.log.error({ error }, "POST preferences error");
    res.status(500).json({ error: "Internal server error saving preferences" });
  }
});

export default router;

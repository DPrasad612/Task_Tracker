import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { orderedTaskIds } = await request.json();

    if (!orderedTaskIds || !Array.isArray(orderedTaskIds)) {
      return NextResponse.json(
        { error: "Missing or invalid orderedTaskIds array" },
        { status: 400 }
      );
    }

    // Run updates in transaction
    const updates = orderedTaskIds.map((id, index) =>
      db.task.updateMany({
        where: { id, userId: user.id },
        data: { order: index },
      })
    );

    await db.$transaction(updates);

    return NextResponse.json({ success: true, message: "Tasks reordered successfully" });
  } catch (error: any) {
    console.error("Reorder tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error reordering tasks" },
      { status: 500 }
    );
  }
}

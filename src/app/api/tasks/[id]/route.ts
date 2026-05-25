import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, category, color, icon, priority } = body;

    // Check ownership
    const task = await db.task.findUnique({
      where: { id },
    });

    if (!task || task.userId !== user.id) {
      return NextResponse.json(
        { error: "Task not found or unauthorized" },
        { status: 404 }
      );
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : task.name,
        category: category !== undefined ? category : task.category,
        color: color !== undefined ? color : task.color,
        icon: icon !== undefined ? icon : task.icon,
        priority: priority !== undefined ? priority : task.priority,
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error("PUT task error:", error);
    return NextResponse.json(
      { error: "Internal server error updating task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const task = await db.task.findUnique({
      where: { id },
    });

    if (!task || task.userId !== user.id) {
      return NextResponse.json(
        { error: "Task not found or unauthorized" },
        { status: 404 }
      );
    }

    // Cascade delete is configured in prisma schema, so delete will automatically remove subtasks
    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("DELETE task error:", error);
    return NextResponse.json(
      { error: "Internal server error deleting task" },
      { status: 500 }
    );
  }
}

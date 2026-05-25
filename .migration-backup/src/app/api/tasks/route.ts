import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildTaskTree } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing startDate or endDate query parameters" },
        { status: 400 }
      );
    }

    // Fetch all user tasks
    const tasks = await db.task.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    });

    // Fetch progress logs for the week
    const logs = await db.progressLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Construct the nested tree
    const taskTree = buildTaskTree(tasks, logs);

    return NextResponse.json({ tasks: taskTree });
  } catch (error: any) {
    console.error("GET tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, category, color, icon, priority, parentId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Task name is required" }, { status: 400 });
    }

    // Calculate next order
    const taskCount = await db.task.count({
      where: {
        userId: user.id,
        parentId: parentId || null,
      },
    });

    const task = await db.task.create({
      data: {
        userId: user.id,
        name: name.trim(),
        category: category || "General",
        color: color || "#3B82F6",
        icon: icon || "Check",
        priority: priority || "medium",
        parentId: parentId || null,
        order: taskCount,
      },
      include: {
        subtasks: true,
        progressLogs: true,
      },
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("POST task error:", error);
    return NextResponse.json(
      { error: "Internal server error creating task" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password & create user
    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        preferences: {
          create: {
            theme: "light",
            workWeek: "mon-sun",
          },
        },
      },
      include: {
        preferences: true,
      },
    });

    // --- FTUX Seeding (First-Time User Experience) ---
    // Generate dates for today, yesterday, and 2 days ago to seed data
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    const twoDaysAgo = formatDate(new Date(Date.now() - 172800000));

    // Define seed tasks
    const seedTasks = [
      { name: "Wake Up On Time", category: "General", color: "#3B82F6", priority: "high", order: 0 },
      { name: "Drink Water", category: "Health", color: "#10B981", priority: "medium", order: 1 },
      { name: "Deep Work (1 Hr)", category: "Work", color: "#F59E0B", priority: "high", order: 2 },
      { name: "Read 10 Minutes", category: "Personal", color: "#EC4899", priority: "low", order: 3 },
    ];

    // Create tasks
    for (const t of seedTasks) {
      const createdTask = await db.task.create({
        data: {
          userId: user.id,
          name: t.name,
          category: t.category,
          color: t.color,
          priority: t.priority,
          order: t.order,
        }
      });

      // Complete some tasks to build a 3-day streak
      if (t.name === "Wake Up On Time" || t.name === "Drink Water") {
        await db.progressLog.createMany({
          data: [
            { userId: user.id, taskId: createdTask.id, date: twoDaysAgo, completed: true },
            { userId: user.id, taskId: createdTask.id, date: yesterday, completed: true },
            { userId: user.id, taskId: createdTask.id, date: today, completed: true },
          ]
        });
      }
    }

    // Create a nested parent task
    const parentTask = await db.task.create({
      data: {
        userId: user.id,
        name: "Learn Data Structures",
        category: "Study",
        color: "#8B5CF6",
        priority: "high",
        order: 4,
      }
    });

    const subtasks = ["Arrays", "Linked Lists", "Trees"];
    for (let i = 0; i < subtasks.length; i++) {
      const sub = await db.task.create({
        data: {
          userId: user.id,
          name: subtasks[i],
          category: "Study",
          color: "#8B5CF6",
          priority: "high",
          parentId: parentTask.id,
          order: i,
        }
      });

      // Seed subtask progress
      if (subtasks[i] === "Arrays") {
        await db.progressLog.createMany({
          data: [
            { userId: user.id, taskId: sub.id, date: yesterday, completed: true },
            { userId: user.id, taskId: sub.id, date: today, completed: true },
          ]
        });
      } else if (subtasks[i] === "Linked Lists") {
        await db.progressLog.create({
          data: { userId: user.id, taskId: sub.id, date: yesterday, completed: true }
        });
      }
    }

    // Create token
    const token = signToken({ userId: user.id, email: user.email });

    // Set token in cookies
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Return user info (exclude passwordHash)
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error during signup" },
      { status: 500 }
    );
  }
}

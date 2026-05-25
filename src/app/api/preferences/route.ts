import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { theme, workWeek } = await request.json();

    const preferences = await db.preference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        theme: theme || "light",
        workWeek: workWeek || "mon-sun",
      },
      update: {
        theme: theme !== undefined ? theme : undefined,
        workWeek: workWeek !== undefined ? workWeek : undefined,
      },
    });

    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error("POST preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error saving preferences" },
      { status: 500 }
    );
  }
}

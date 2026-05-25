import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Internal server error checking session" },
      { status: 500 }
    );
  }
}

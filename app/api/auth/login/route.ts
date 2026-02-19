import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body?.email?.trim();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const baseUrl = process.env.WC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: "Auth unavailable" }, { status: 401 });
    }

    const response = await fetch(`${baseUrl}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: email,
        password,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const data = (await response.json()) as { token?: string };
    if (!data?.token) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set({
      name: "auth_token",
      value: data.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

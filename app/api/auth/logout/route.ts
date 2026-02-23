import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/errors";
import { destroySession } from "@/lib/auth-session";

export async function POST() {
  const res = NextResponse.json(apiSuccess({}));
  const cookie = destroySession();
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

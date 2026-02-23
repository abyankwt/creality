import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";
import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth-session";
import { verifyCustomerPassword, updateWooCustomer } from "@/lib/woo-client";
import { verifyPassword, hashPassword } from "@/lib/password";
import type { UserSession } from "@/lib/types";

type LoginPayload = {
  email?: string;
  password?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginPayload;
    if (!body || typeof body !== "object") {
      return NextResponse.json(apiError(ERROR_MESSAGES.badRequest), { status: 400 });
    }
    const email = body?.email?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";

    if (!email || !password || !emailRegex.test(email)) {
      return NextResponse.json(apiError(ERROR_MESSAGES.badRequest), { status: 400 });
    }

    // Look up customer by email and get stored password hash
    const customerResult = await verifyCustomerPassword(email);
    if (!customerResult) {
      console.log(`[Login] No customer found for email: ${email}`);
      return NextResponse.json(apiError(ERROR_MESSAGES.invalidCredentials), { status: 401 });
    }

    const { customer, storedHash } = customerResult;
    console.log(`[Login] Found customer: id=${customer.id}, email=${customer.email}, hasHash=${!!storedHash}, metaKeys=${customer.meta_data?.map(m => m.key).join(",")}`);

    // Verify the password against the stored hash
    if (storedHash) {
      // Normal flow: verify against stored hash
      if (!verifyPassword(password, storedHash)) {
        console.log(`[Login] Password mismatch for customer ${customer.id}`);
        return NextResponse.json(apiError(ERROR_MESSAGES.invalidCredentials), { status: 401 });
      }
    } else {
      // Migration: no hash stored yet (pre-existing account).
      // Store the password hash now so future logins can verify.
      console.log(`[Login] No hash stored for customer ${customer.id}. Storing hash now (first-time migration).`);
      const newHash = hashPassword(password);
      await updateWooCustomer(customer.id, {
        meta_data: [{ key: "_app_password_hash", value: newHash }],
      });
    }

    const session: UserSession = {
      userId: customer.id,
      name: `${customer.first_name} ${customer.last_name}`.trim() || email,
      email: customer.email,
    };

    const sessionToken = await createSession(session);
    const res = NextResponse.json(apiSuccess(session));
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return res;
  } catch (error) {
    const message = resolveErrorMessage(error, ERROR_MESSAGES.serverError);
    return NextResponse.json(apiError(message), { status: 500 });
  }
}

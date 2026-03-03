import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";

const WP_BASE = process.env.WC_BASE_URL?.replace(/\/$/, "") ?? "";

function getCredentials() {
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;
    if (!consumerKey || !consumerSecret) throw new Error("Missing WooCommerce credentials");
    return { consumerKey, consumerSecret };
}

async function wpLoyaltyFetch(path: string, init?: RequestInit) {
    const { consumerKey, consumerSecret } = getCredentials();
    const url = `${WP_BASE}/wp-json/creality-loyalty/v1/${path}`;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    return fetch(url, {
        ...init,
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(init?.headers ?? {}),
        },
        cache: "no-store",
    });
}

/** GET /api/account/loyalty — get points summary */
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!token) return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });

        const session = await verifySession(token);
        if (!session) return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });

        const res = await wpLoyaltyFetch("points");
        if (!res.ok) {
            return NextResponse.json(apiError(ERROR_MESSAGES.serviceUnavailable), { status: res.status });
        }

        const body = (await res.json()) as { success: boolean; data: unknown };
        return NextResponse.json(apiSuccess(body.data));
    } catch (error) {
        return NextResponse.json(apiError(resolveErrorMessage(error, ERROR_MESSAGES.serverError)), { status: 500 });
    }
}

/** POST /api/account/loyalty — redeem points */
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!token) return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });

        const session = await verifySession(token);
        if (!session) return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });

        const payload = await request.json();

        const res = await wpLoyaltyFetch("redeem", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        const body = await res.json();
        if (!res.ok) {
            return NextResponse.json(apiError(body?.message ?? ERROR_MESSAGES.serverError), { status: res.status });
        }

        return NextResponse.json(apiSuccess(body.data));
    } catch (error) {
        return NextResponse.json(apiError(resolveErrorMessage(error, ERROR_MESSAGES.serverError)), { status: 500 });
    }
}

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

type RouteContext = { params: Promise<{ id: string; action: string }> };

/** POST /api/account/subscriptions/[id]/[action] — pause / resume / cancel */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { id, action } = await context.params;

        const validActions = ["pause", "resume", "cancel"];
        if (!validActions.includes(action)) {
            return NextResponse.json(apiError("Invalid action."), { status: 400 });
        }

        const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!token) return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });

        const session = await verifySession(token);
        if (!session) return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });

        const { consumerKey, consumerSecret } = getCredentials();
        const url = `${WP_BASE}/wp-json/creality/v1/subscriptions/${id}/${action}`;
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            cache: "no-store",
        });

        const body = await res.json();
        if (!res.ok) {
            return NextResponse.json(apiError(body?.message ?? ERROR_MESSAGES.serverError), { status: res.status });
        }

        return NextResponse.json(apiSuccess(body));
    } catch (error) {
        return NextResponse.json(apiError(resolveErrorMessage(error, ERROR_MESSAGES.serverError)), { status: 500 });
    }
}

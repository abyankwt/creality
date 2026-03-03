import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";

export const runtime = "nodejs";

const WP_BASE = process.env.WC_BASE_URL?.replace(/\/$/, "") ?? "";

function getCredentials() {
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;
    if (!consumerKey || !consumerSecret) throw new Error("Missing WooCommerce credentials");
    return { consumerKey, consumerSecret };
}

/**
 * POST /api/print/analyze
 * Public endpoint — no login required for getting a price estimate.
 * Forwards multipart file upload to the WordPress print estimator plugin.
 */
export async function POST(request: NextRequest) {
    try {
        // Read multipart form data from the incoming request.
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File) || file.size === 0) {
            return NextResponse.json(apiError("No file uploaded. Please provide an STL or OBJ file."), { status: 400 });
        }

        // Build a new FormData to forward to WordPress.
        const wpForm = new FormData();
        wpForm.append("file", file, file.name);

        const { consumerKey, consumerSecret } = getCredentials();
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

        const wpRes = await fetch(`${WP_BASE}/wp-json/creality-print/v1/analyze`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
            },
            body: wpForm,
        });

        const body = await wpRes.json();

        if (!wpRes.ok) {
            const msg = body?.message ?? body?.data?.message ?? ERROR_MESSAGES.serverError;
            return NextResponse.json(apiError(msg), { status: wpRes.status });
        }

        return NextResponse.json(apiSuccess(body.data ?? body));
    } catch (error) {
        return NextResponse.json(apiError(resolveErrorMessage(error, ERROR_MESSAGES.serverError)), { status: 500 });
    }
}

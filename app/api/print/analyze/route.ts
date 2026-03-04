import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";

export const runtime = "nodejs";

const WP_BASE = process.env.WC_BASE_URL?.replace(/\/$/, "") ?? "";

/**
 * POST /api/print/analyze
 * Forwards multipart file upload to the WordPress print estimator plugin.
 * Public endpoint — no user auth required for estimation.
 * Auth is enforced on the add-to-cart step instead.
 *
 * Note: The WP plugin endpoint is also public (__return_true),
 * so no credentials are needed for this call.
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

        const wpRes = await fetch(`${WP_BASE}/wp-json/creality-print/v1/analyze`, {
            method: "POST",
            headers: {
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

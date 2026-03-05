import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";
import { getWooOrder, updateWooOrder } from "@/lib/woo-client";

type CancelBody = {
    order_id?: number;
};

const CANCELLABLE_STATUSES = ["pending", "processing"];

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!token) {
            return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });
        }

        const session = await verifySession(token);
        if (!session) {
            return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });
        }

        let body: CancelBody;
        try {
            body = (await request.json()) as CancelBody;
        } catch {
            return NextResponse.json(apiError("Invalid request body."), { status: 400 });
        }

        const orderId = body?.order_id;
        if (typeof orderId !== "number" || !Number.isInteger(orderId) || orderId <= 0) {
            return NextResponse.json(apiError("Invalid order ID."), { status: 400 });
        }

        // Fetch the order and verify it belongs to this customer
        const orderResult = await getWooOrder(orderId);
        if (!orderResult.ok || !orderResult.data) {
            return NextResponse.json(apiError("Order not found."), { status: 404 });
        }

        if (orderResult.data.customer_id !== session.userId) {
            return NextResponse.json(apiError("You do not have permission to cancel this order."), { status: 403 });
        }

        if (!CANCELLABLE_STATUSES.includes(orderResult.data.status)) {
            return NextResponse.json(
                apiError(`Order cannot be cancelled. Current status: ${orderResult.data.status}`),
                { status: 422 }
            );
        }

        // Update order status to cancelled
        const updateResult = await updateWooOrder(orderId, { status: "cancelled" });
        if (!updateResult.ok) {
            return NextResponse.json(apiError("Failed to cancel order. Please try again."), { status: 502 });
        }

        return NextResponse.json(apiSuccess({ order_id: orderId, status: "cancelled" }));
    } catch (error) {
        const message = resolveErrorMessage(error, ERROR_MESSAGES.serverError);
        return NextResponse.json(apiError(message), { status: 500 });
    }
}

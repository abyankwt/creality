import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";
import { buildOrderTrackingSummary } from "@/lib/orderTracking";
import { getWooOrder, getWooProductsByIds } from "@/lib/woo-client";
import type { WooOrder } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });
    }

    const { id } = await context.params;
    const orderId = Number(id);
    if (!Number.isFinite(orderId)) {
      return NextResponse.json(apiError("Invalid order id."), { status: 400 });
    }

    const response = await getWooOrder(orderId);
    if (!response.ok || !response.data) {
      return NextResponse.json(apiError(ERROR_MESSAGES.serviceUnavailable), {
        status: response.status || 502,
      });
    }

    if (response.data.customer_id !== session.userId) {
      return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 403 });
    }

    const productIds = (response.data.line_items ?? []).map((item) => item.product_id);
    const productResponse = await getWooProductsByIds(productIds);
    const productsById = new Map(
      (productResponse.ok ? productResponse.data : []).map((product) => [
        product.id,
        product,
      ])
    );

    const order: WooOrder = {
      id: response.data.id,
      status: response.data.status,
      date_created: response.data.date_created,
      date: response.data.date_created,
      total: response.data.total,
      currency: response.data.currency,
      line_items: response.data.line_items?.map((item) => ({
        id: item.id,
        name: item.name,
        product_id: item.product_id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        total: item.total,
        price: item.price,
        image: item.image,
      })),
      billing: response.data.billing,
      shipping: response.data.shipping,
      payment_method_title: response.data.payment_method_title,
      tracking: buildOrderTrackingSummary({
        date_created: response.data.date_created,
        status: response.data.status,
        products: (response.data.line_items ?? []).map((item) =>
          productsById.get(item.product_id)
        ),
      }),
    };

    return NextResponse.json(apiSuccess(order));
  } catch (error) {
    return NextResponse.json(
      apiError(resolveErrorMessage(error, ERROR_MESSAGES.serverError)),
      { status: 500 }
    );
  }
}

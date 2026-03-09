import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";
import { enrichCartResponseWithAvailability } from "@/lib/cart-availability";
import { requiresOrderWarning } from "@/lib/availability";

const WC_CART_TOKEN_COOKIE = "wc_cart_token";
const WC_NONCE_COOKIE = "wc_nonce";

type CheckoutBody = {
    billing_address: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        country: string;
        state: string;
        city: string;
        address_1: string;
        address_2?: string;
        postcode?: string;
    };
    shipping_address?: {
        first_name: string;
        last_name: string;
        country: string;
        state: string;
        city: string;
        address_1: string;
        address_2?: string;
        postcode?: string;
    };
    payment_method: string;
    order_warning_acknowledged?: boolean;
};

type WooCheckoutResponse = {
    order_id: number;
    status: string;
    order_key: string;
    customer_note: string;
    payment_result: {
        payment_status: string;
        payment_details: Array<{ key: string; value: string }>;
        redirect_url: string;
    };
};

/**
 * POST /api/store/checkout
 *
 * Headless checkout using the WooCommerce Store API:
 * 1. Receives billing info + payment method from the Next.js checkout page
 * 2. Forwards to WooCommerce Store API POST /checkout with Cart-Token
 * 3. Returns the payment gateway redirect URL to the frontend
 *
 * The customer never sees the old WooCommerce site.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const baseUrl = process.env.WC_BASE_URL?.replace(/\/$/, "");

    if (!baseUrl) {
        return NextResponse.json(
            { error: "Missing WooCommerce configuration." },
            { status: 500 }
        );
    }

    // Parse the checkout body from the frontend
    let body: CheckoutBody;
    try {
        body = (await request.json()) as CheckoutBody;
    } catch {
        return NextResponse.json(
            { error: "Invalid request body." },
            { status: 400 }
        );
    }

    // Get cart token and nonce from cookies
    const cartToken = request.cookies.get(WC_CART_TOKEN_COOKIE)?.value;
    const nonce = request.cookies.get(WC_NONCE_COOKIE)?.value;

    if (!cartToken) {
        return NextResponse.json(
            { error: "No cart session found. Please add items to your cart." },
            { status: 400 }
        );
    }

    // Verify the user is logged in
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    let customerId: number | undefined;
    if (sessionToken) {
        const session = await verifySession(sessionToken);
        if (session) {
            customerId = session.userId;
        }
    }

    if (!customerId) {
        return NextResponse.json(
            { error: "Please log in or register before placing an order." },
            { status: 401 }
        );
    }

    // Build headers for WooCommerce Store API
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cart-Token": cartToken,
    };

    if (nonce) {
        headers["Nonce"] = nonce;
    }

    let protectedItemsInCart = false;
    try {
        const cartResponse = await fetch(
            `${baseUrl}/wp-json/wc/store/v1/cart`,
            {
                method: "GET",
                headers,
                cache: "no-store",
            }
        );

        if (cartResponse.ok) {
            const cartData = await cartResponse.json();
            const enrichedCart = await enrichCartResponseWithAvailability(cartData);
            protectedItemsInCart = Boolean(
                enrichedCart &&
                typeof enrichedCart === "object" &&
                Array.isArray((enrichedCart as { items?: Array<{ availability?: { type: "available" | "special" | "preorder" } }> }).items) &&
                (enrichedCart as { items: Array<{ availability?: { type: "available" | "special" | "preorder" } }> }).items.some((item) =>
                    item.availability ? requiresOrderWarning(item.availability.type) : false
                )
            );
        }
    } catch (error) {
        console.error("[Checkout] Failed to validate protected items:", error);
    }

    if (protectedItemsInCart && !body.order_warning_acknowledged) {
        return NextResponse.json(
            {
                error:
                    "Please acknowledge the special order or pre-order policy before checkout.",
            },
            { status: 400 }
        );
    }

    // Use shipping = billing if not provided
    const shippingAddress = body.shipping_address || {
        first_name: body.billing_address.first_name,
        last_name: body.billing_address.last_name,
        country: body.billing_address.country,
        state: body.billing_address.state || "",
        city: body.billing_address.city,
        address_1: body.billing_address.address_1,
        address_2: body.billing_address.address_2 || "",
        postcode: body.billing_address.postcode || "",
    };

    // Build the Store API checkout payload
    const checkoutPayload = {
        billing_address: {
            ...body.billing_address,
            state: body.billing_address.state || "",
            address_2: body.billing_address.address_2 || "",
            postcode: body.billing_address.postcode || "",
        },
        shipping_address: shippingAddress,
        payment_method: body.payment_method,
        customer_id: customerId,
        payment_data: [] as Array<{ key: string; value: string }>,
    };

    // Call the WooCommerce Store API checkout endpoint
    let wooResponse: Response;
    try {
        wooResponse = await fetch(
            `${baseUrl}/wp-json/wc/store/v1/checkout`,
            {
                method: "POST",
                headers,
                body: JSON.stringify(checkoutPayload),
                cache: "no-store",
            }
        );
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        console.error("[Checkout] Failed to reach WooCommerce:", msg);
        return NextResponse.json(
            { error: `Failed to reach payment system: ${msg}` },
            { status: 502 }
        );
    }

    const responseText = await wooResponse.text();
    let responseData: WooCheckoutResponse | { message?: string; code?: string };

    try {
        responseData = JSON.parse(responseText);
    } catch {
        console.error("[Checkout] Invalid JSON from WooCommerce:", responseText.slice(0, 200));
        return NextResponse.json(
            { error: "Invalid response from payment system." },
            { status: 502 }
        );
    }

    if (!wooResponse.ok) {
        const errMsg =
            (responseData as { message?: string }).message ||
            "Checkout failed. Please try again.";
        console.error(`[Checkout] WooCommerce error ${wooResponse.status}:`, errMsg);
        return NextResponse.json(
            { error: errMsg },
            { status: wooResponse.status }
        );
    }

    // Success — return the payment redirect URL
    const checkout = responseData as WooCheckoutResponse;
    const redirectUrl = checkout.payment_result?.redirect_url;

    if (!redirectUrl) {
        // Order was created but no redirect needed (e.g., free order)
        return NextResponse.json({
            success: true,
            order_id: checkout.order_id,
            redirect_url: `/order-success?order=${checkout.order_id}`,
        });
    }

    // Clear the cart token since the order has been placed
    const res = NextResponse.json({
        success: true,
        order_id: checkout.order_id,
        redirect_url: redirectUrl,
    });

    // Clear cart cookies after successful checkout
    res.cookies.delete(WC_CART_TOKEN_COOKIE);
    res.cookies.delete(WC_NONCE_COOKIE);

    return res;
}

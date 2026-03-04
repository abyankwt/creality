import { NextResponse, type NextRequest } from "next/server";

const WC_CART_TOKEN_COOKIE = "wc_cart_token";

type StoreCartItem = {
    id: number;
    quantity: number;
    name?: string;
    prices?: {
        price: string;
        currency_minor_unit?: number;
    };
};

type StoreCartResponse = {
    items: StoreCartItem[];
    items_count: number;
};

type WCOrderResponse = {
    id: number;
    order_key: string;
    status: string;
};

/**
 * GET /api/store/checkout
 *
 * Bridge between the Store API cart and WooCommerce checkout:
 * 1. Reads the current cart from Store API using the cookie-persisted Cart-Token
 * 2. Creates a WooCommerce pending order with those line items
 * 3. Redirects the user to the WooCommerce order-pay page for payment
 *
 * This way the customer stays on the Next.js frontend until checkout.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    const baseUrl = process.env.WC_BASE_URL?.replace(/\/$/, "");
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!baseUrl || !consumerKey || !consumerSecret) {
        return NextResponse.json(
            { error: "Missing WooCommerce configuration." },
            { status: 500 }
        );
    }

    // Step 1: Read the cart from Store API using the cookie-stored Cart-Token
    const cartToken = request.cookies.get(WC_CART_TOKEN_COOKIE)?.value;

    const cartHeaders: Record<string, string> = {
        Accept: "application/json",
    };
    if (cartToken) {
        cartHeaders["Cart-Token"] = cartToken;
    }

    let cart: StoreCartResponse;
    try {
        const cartRes = await fetch(`${baseUrl}/wp-json/wc/store/cart`, {
            headers: cartHeaders,
            cache: "no-store",
        });

        if (!cartRes.ok) {
            console.error(`[Checkout] Failed to read cart: ${cartRes.status}`);
            // Fallback: redirect to the store page
            return NextResponse.redirect(new URL("/store", request.url));
        }

        cart = (await cartRes.json()) as StoreCartResponse;
    } catch (error) {
        console.error("[Checkout] Error reading cart:", error);
        return NextResponse.redirect(new URL("/store", request.url));
    }

    // If cart is empty, redirect back to store
    if (!cart.items || cart.items.length === 0) {
        return NextResponse.redirect(new URL("/store", request.url));
    }

    // Step 2: Create a WooCommerce pending order with the cart items
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const lineItems = cart.items.map((item) => {
        // Store API prices are in minor units (e.g., cents)
        const minorUnit = item.prices?.currency_minor_unit ?? 3;
        const priceNum = Number(item.prices?.price ?? 0);
        const realPrice = priceNum / Math.pow(10, minorUnit);

        return {
            product_id: item.id,
            quantity: item.quantity,
            // Let WooCommerce determine the price from the product
            // Only override if you need custom pricing
        };
    });

    const orderPayload = {
        status: "pending",
        set_paid: false,
        line_items: lineItems,
    };

    let order: WCOrderResponse;
    try {
        const orderRes = await fetch(`${baseUrl}/wp-json/wc/v3/orders`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(orderPayload),
        });

        if (!orderRes.ok) {
            const errText = await orderRes.text();
            console.error(`[Checkout] Failed to create order: ${orderRes.status}`, errText);
            return NextResponse.json(
                { error: "Failed to create checkout order." },
                { status: 500 }
            );
        }

        order = (await orderRes.json()) as WCOrderResponse;
    } catch (error) {
        console.error("[Checkout] Error creating order:", error);
        return NextResponse.json(
            { error: "Failed to create checkout order." },
            { status: 500 }
        );
    }

    // Step 3: Build the WooCommerce order-pay URL and redirect
    const checkoutBase = process.env.NEXT_PUBLIC_WC_CHECKOUT_URL?.replace(/\/$/, "")
        || `${baseUrl}/checkout`;
    const payUrl = `${checkoutBase}/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;

    return NextResponse.redirect(payUrl);
}

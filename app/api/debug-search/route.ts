import { NextResponse } from "next/server";

/** Temporary debug route — searches WooCommerce products by name */
export async function GET(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";

    const wordpressUrl = process.env.WC_BASE_URL || process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
        return NextResponse.json({ error: "Missing credentials" }, { status: 500 });
    }

    const url = `${wordpressUrl}/wp-json/wc/v3/products?search=${encodeURIComponent(search)}&per_page=5`;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const response = await fetch(url, {
        headers: { Authorization: `Basic ${auth}` },
        cache: "no-store",
    });

    if (!response.ok) {
        const body = await response.text();
        return NextResponse.json({ status: response.status, body }, { status: response.status });
    }

    const products = (await response.json()) as Array<{
        id: number;
        name: string;
        sku: string;
        weight: string;
        dimensions: { length: string; width: string; height: string };
        stock_status: string;
    }>;

    return NextResponse.json(
        products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            weight: p.weight,
            dimensions: p.dimensions,
            stock_status: p.stock_status,
        }))
    );
}

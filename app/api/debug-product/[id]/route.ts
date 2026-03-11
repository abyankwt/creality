import { NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

/** Debug: tests query-param auth AND checks if WordPress post meta has shipping data */
export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
    const { id } = await context.params;
    const wordpressUrl = process.env.WC_BASE_URL || process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
        return NextResponse.json({ error: "Missing credentials" }, { status: 500 });
    }

    const results: Record<string, unknown> = {};

    // Test 1: WC v3 with query-param auth (some WC setups prefer this over Basic Auth)
    try {
        const url = `${wordpressUrl}/wp-json/wc/v3/products/${id}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
            const p = await res.json();
            results.wc_v3_query_auth = {
                id: p.id, name: p.name, weight: p.weight, dimensions: p.dimensions,
            };
        } else {
            results.wc_v3_query_auth = { error: res.status, body: await res.text() };
        }
    } catch (e) {
        results.wc_v3_query_auth = { error: String(e) };
    }

    // Test 2: Old WC API (legacy endpoint)
    try {
        const url = `${wordpressUrl}/wc-api/v3/products/${id}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            const p = data.product || data;
            results.wc_legacy = {
                id: p.id, name: p.title || p.name, weight: p.weight, dimensions: p.dimensions,
            };
        } else {
            results.wc_legacy = { error: res.status };
        }
    } catch (e) {
        results.wc_legacy = { error: String(e) };
    }

    // Test 3: WordPress REST API - try to get post meta directly
    try {
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
        const url = `${wordpressUrl}/wp-json/wp/v2/product/${id}?context=edit`;
        const res = await fetch(url, {
            headers: { Authorization: `Basic ${auth}` },
            cache: "no-store",
        });
        if (res.ok) {
            const p = await res.json();
            results.wp_rest = { id: p.id, title: p.title, meta: p.meta, status: p.status };
        } else {
            results.wp_rest = { error: res.status, body: (await res.text()).slice(0, 500) };
        }
    } catch (e) {
        results.wp_rest = { error: String(e) };
    }

    return NextResponse.json(results);
}

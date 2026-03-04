import "server-only";

import type { WCCategory } from "./api";

export type CategoryNode = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    children: CategoryNode[];
};

/**
 * Fetch all WooCommerce product categories and return a parent→children tree.
 * Uses ISR with 1-hour revalidation so the menu stays fast without stale data.
 */
export async function getCategoryTree(): Promise<CategoryNode[]> {
    try {
        const baseUrl = (process.env.WC_BASE_URL ?? "").replace(/\/$/, "");
        const consumerKey = process.env.WC_CONSUMER_KEY ?? "";
        const consumerSecret = process.env.WC_CONSUMER_SECRET ?? "";

        if (!baseUrl || !consumerKey || !consumerSecret) {
            console.warn("[MegaMenu] Missing WC credentials — returning empty tree");
            return [];
        }

        const url = new URL(`${baseUrl}/wp-json/wc/v3/products/categories`);
        url.searchParams.set("per_page", "100");
        url.searchParams.set("hide_empty", "false");

        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
            },
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            console.error(`[MegaMenu] Failed to fetch categories: ${response.status}`);
            return [];
        }

        const raw: WCCategory[] = await response.json();
        return buildTree(raw);
    } catch (error) {
        console.error("[MegaMenu] Error fetching category tree:", error);
        return [];
    }
}

/** Decode common HTML entities returned by WooCommerce (e.g. &amp; → &) */
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#8211;/g, "–")
        .replace(/&#8212;/g, "—");
}

function buildTree(categories: WCCategory[]): CategoryNode[] {
    // Filter out "Uncategorized" (WC default, id 15 commonly or name match)
    const filtered = categories.filter(
        (c) => c.slug !== "uncategorized" && c.name.toLowerCase() !== "uncategorized"
    );

    const nodeMap = new Map<number, CategoryNode>();

    // Create nodes
    for (const cat of filtered) {
        nodeMap.set(cat.id, {
            id: cat.id,
            name: decodeHtmlEntities(cat.name),
            slug: cat.slug,
            image: cat.image?.src ?? null,
            children: [],
        });
    }

    const roots: CategoryNode[] = [];

    // Build parent-child relationships
    for (const cat of filtered) {
        const node = nodeMap.get(cat.id);
        if (!node) continue;

        if (cat.parent === 0 || !nodeMap.has(cat.parent)) {
            roots.push(node);
        } else {
            const parent = nodeMap.get(cat.parent);
            parent?.children.push(node);
        }
    }

    // Sort alphabetically: parents first, then children
    roots.sort((a, b) => a.name.localeCompare(b.name));
    for (const root of roots) {
        root.children.sort((a, b) => a.name.localeCompare(b.name));
    }

    return roots;
}

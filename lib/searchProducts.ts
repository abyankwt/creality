import type { Product } from "@/lib/woocommerce-types";

const getSearchBase = () =>
  process.env.NEXT_PUBLIC_WP_API ??
  process.env.NEXT_PUBLIC_WC_BASE_URL ??
  "";

export async function searchProducts(query: string): Promise<Product[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const base = getSearchBase().replace(/\/$/, "");
  const endpoint = `${base}/wp-json/wc/store/v1/products?search=${encodeURIComponent(
    trimmed
  )}`;

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Search failed (${response.status})`);
  }

  return (await response.json()) as Product[];
}

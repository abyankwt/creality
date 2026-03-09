import "server-only";

export type {
  FetchProductsOptions,
} from "@/lib/woocommerce";
export type {
  Product as WCProduct,
  ProductAttribute,
  ProductCategory as WCCategory,
  ProductImage as WCImage,
  ProductTag,
} from "@/lib/woocommerce-types";

export {
  fetchProductBySlug,
  fetchProductCategories as fetchCategories,
  fetchProducts,
  fetchProductsByCategory,
  fetchProductsByIds,
} from "@/lib/woocommerce";

export async function fetchHeroImages(): Promise<string[]> {
  const baseUrl = process.env.WC_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return [];

  try {
    const pageResponse = await fetch(`${baseUrl}/?page_id=30116`, {
      next: { revalidate: 60 },
    });
    if (!pageResponse.ok) return [];

    const html = await pageResponse.text();
    const repeaterIds: string[] = [];
    for (const match of html.matchAll(
      /elementor-repeater-item-([a-f0-9]+)\s+swiper-slide/g
    )) {
      if (match[1] && !repeaterIds.includes(match[1])) {
        repeaterIds.push(match[1]);
      }
    }

    if (repeaterIds.length === 0) return [];

    const cssResponse = await fetch(
      `${baseUrl}/wp-content/uploads/elementor/css/post-30116.css`,
      { next: { revalidate: 60 } }
    );
    if (!cssResponse.ok) return [];

    const css = await cssResponse.text();
    const images: string[] = [];

    for (const id of repeaterIds) {
      const regex = new RegExp(
        `\\.elementor-repeater-item-${id}[^}]*background-image:\\s*url\\(["']?([^"')]+)["']?\\)`,
        "i"
      );
      const match = css.match(regex);
      if (match?.[1]) {
        images.push(match[1]);
      }
    }

    return images;
  } catch (error) {
    console.error("Error fetching WP hero images:", error);
    return [];
  }
}

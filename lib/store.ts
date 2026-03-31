import "server-only";

import { fetchProductBySlug } from "@/lib/woocommerce";
import { fetchUsedPrinterProductBySlug } from "@/lib/usedPrinters";

export async function fetchStoreProductBySlug(slug: string) {
  const product = await fetchProductBySlug(slug);
  if (product) {
    return product;
  }

  return fetchUsedPrinterProductBySlug(slug);
}

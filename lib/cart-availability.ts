import "server-only";

import { getProductAvailability } from "@/lib/availability";
import { fetchProductsByIds } from "@/lib/woocommerce";

type CartItemLike = {
  id?: number;
  availability?: ReturnType<typeof getProductAvailability>;
};

type CartResponseLike = {
  items?: CartItemLike[];
};

function hasCartItems(value: unknown): value is CartResponseLike {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Array.isArray((value as CartResponseLike).items);
}

export async function enrichCartResponseWithAvailability<T>(data: T): Promise<T> {
  if (!hasCartItems(data)) {
    return data;
  }

  const ids = Array.from(
    new Set(
      data.items
        ?.map((item) => item.id)
        .filter((value): value is number => typeof value === "number" && value > 0) ?? []
    )
  );

  if (ids.length === 0) {
    return data;
  }

  try {
    const { data: products } = await fetchProductsByIds(ids);
    const productsById = new Map(products.map((product) => [product.id, product]));

    return {
      ...(data as object),
      items: data.items?.map((item) => ({
        ...item,
        availability: item.id ? getProductAvailability(productsById.get(item.id)) : undefined,
      })),
    } as T;
  } catch (error) {
    console.error("[Cart] Failed to enrich availability:", error);
    return data;
  }
}

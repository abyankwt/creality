import type { Product } from "@/lib/woocommerce-types";

export type ProductOrderingType =
  | "available"
  | "special"
  | "preorder"
  | "unavailable";

export type ProductAvailability = {
  type: ProductOrderingType;
  label: string;
  badge: string;
  leadTime: string | null;
};

function matchesCategory(
  product: Pick<Product, "categories"> | null | undefined,
  values: string[]
) {
  return (product?.categories ?? []).some((category) => {
    const name = category.name.toLowerCase();
    const slug = category.slug.toLowerCase();
    return values.some((value) => name.includes(value) || slug.includes(value));
  });
}

export function getProductAvailability(
  product:
    | Pick<Product, "stock_status" | "categories" | "tags">
    | null
    | undefined
): ProductAvailability {
  const isPreorder = (product?.tags ?? []).some((tag) =>
    tag.name.toLowerCase().includes("preorder") ||
    tag.slug.toLowerCase().includes("preorder")
  );

  const isPrinterCategory = matchesCategory(product, ["printer"]);

  if (product?.stock_status === "instock") {
    return {
      type: "available",
      label: "Buy Now",
      badge: "In Stock",
      leadTime: null,
    };
  }

  if (isPreorder) {
    return {
      type: "preorder",
      label: "Pre-order",
      badge: "Pre-order",
      leadTime: "30-45 days",
    };
  }

  if (product?.stock_status === "outofstock" && isPrinterCategory) {
    return {
      type: "special",
      label: "Special Order",
      badge: "Special Order",
      leadTime: "10-12 days",
    };
  }

  return {
    type: "unavailable",
    label: "Out of Stock",
    badge: "Out of Stock",
    leadTime: null,
  };
}

export function requiresOrderWarning(
  availability: ProductAvailability | ProductOrderingType
): boolean {
  const type = typeof availability === "string" ? availability : availability.type;
  return type === "special" || type === "preorder";
}

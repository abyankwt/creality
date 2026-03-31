import {
  isPreOrderProduct,
  resolveProductLeadTime,
  resolveProductOrderType,
} from "@/lib/productLogic";

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

export function getProductAvailability(
  product:
    | {
        product_order_type?: "pre_order" | "special_order" | "in_stock" | null;
        order_type?: "pre_order" | "special_order" | "in_stock" | null;
        is_preorder?: boolean | null;
        is_in_stock?: boolean | null;
        stock_status?: string | null;
        lead_time?: string | null;
        category_slug?: string[] | null;
        categories?: Array<{ slug: string; name: string }> | null;
        tags?: Array<{ name: string; slug: string }>;
        meta_data?: Array<{ key: string; value: string }>;
      }
    | null
    | undefined
): ProductAvailability {
  const orderType = resolveProductOrderType(product);

  if (orderType === "pre_order" || isPreOrderProduct(product)) {
    return {
      type: "preorder",
      label: "Pre-Order",
      badge: "Pre-Order",
      leadTime: resolveProductLeadTime(product),
    };
  }

  if (orderType === "in_stock") {
    return {
      type: "available",
      label: "Buy Now",
      badge: "In Stock",
      leadTime: null,
    };
  }

  if (orderType === "special_order") {
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

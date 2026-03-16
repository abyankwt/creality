import type { ProductOrderType } from "@/lib/woocommerce-types";

type ProductLike = {
  product_order_type?: ProductOrderType | null;
  is_in_stock?: boolean | null;
};

export function resolveProductOrderType(
  product: ProductLike | null | undefined
): ProductOrderType {
  if (product?.product_order_type) {
    return product.product_order_type;
  }

  return product?.is_in_stock === true ? "in_stock" : "special_order";
}

export type ProductAvailability = {
  type: "preorder" | "available" | "special";
  label: "Pre-Order" | "Add to Cart" | "Special Order";
  lead?: string;
};

export function getProductAvailability(
  product: ProductLike | null | undefined
): ProductAvailability {
  const orderType = resolveProductOrderType(product);

  if (orderType === "in_stock") {
    return {
      type: "available",
      label: "Add to Cart",
    };
  }

  if (orderType === "pre_order") {
    return {
      type: "preorder",
      label: "Pre-Order",
      lead: "Delivery: ~45 days",
    };
  }

  return {
    type: "special",
    label: "Special Order",
    lead: "Delivery: 1012 days",
  };
}

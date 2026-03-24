import type { ProductOrderType } from "@/lib/woocommerce-types";

type ProductCategoryLike = {
  slug?: string | null;
  name?: string | null;
};

type ProductTagLike = {
  slug?: string | null;
  name?: string | null;
};

type ProductMetaLike = {
  key?: string | null;
  value?: unknown;
};

type ProductLike = {
  product_order_type?: ProductOrderType | null;
  order_type?: ProductOrderType | null;
  is_preorder?: boolean | null;
  is_in_stock?: boolean | null;
  stock_status?: string | null;
  category_slug?: string[] | null;
  categories?: ProductCategoryLike[] | null;
  tags?: ProductTagLike[] | null;
  meta_data?: ProductMetaLike[] | null;
  lead_time?: string | null;
};

const PRE_ORDER_DEFAULT_LEAD_TIME = "~45 days";
const PRE_ORDER_META_KEYS = [
  "is_preorder",
  "preorder",
  "pre_order",
  "_is_preorder",
  "_preorder",
  "product_preorder",
];
const PRE_ORDER_LEAD_TIME_KEYS = [
  "lead_time",
  "preorder_lead_time",
  "pre_order_lead_time",
  "_preorder_lead_time",
  "_pre_order_lead_time",
];

function normalizePreOrderToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesPreOrderToken(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return normalizePreOrderToken(value).includes("preorder");
}

function readMetaValue(
  meta: ProductMetaLike[] | null | undefined,
  keys: string[]
): string | null {
  if (!meta?.length) {
    return null;
  }

  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()));
  const matched = meta.find((entry) =>
    entry.key ? normalizedKeys.has(entry.key.toLowerCase()) : false
  );

  if (!matched) {
    return null;
  }

  if (typeof matched.value === "string") {
    return matched.value.trim();
  }

  return String(matched.value).trim();
}

function isTruthyFlag(value: string | null) {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function isPreOrderProduct(product: ProductLike | null | undefined) {
  if (!product) {
    return false;
  }

  if (typeof product.is_preorder === "boolean") {
    return product.is_preorder;
  }

  if (
    product.product_order_type === "pre_order" ||
    product.order_type === "pre_order"
  ) {
    return true;
  }

  if (product.category_slug?.some((slug) => matchesPreOrderToken(slug))) {
    return true;
  }

  if (
    product.categories?.some(
      (category) =>
        matchesPreOrderToken(category.slug) || matchesPreOrderToken(category.name)
    )
  ) {
    return true;
  }

  if (
    product.tags?.some(
      (tag) => matchesPreOrderToken(tag.slug) || matchesPreOrderToken(tag.name)
    )
  ) {
    return true;
  }

  return isTruthyFlag(readMetaValue(product.meta_data, PRE_ORDER_META_KEYS));
}

export function resolveProductLeadTime(
  product: ProductLike | null | undefined
) {
  if (!product) {
    return null;
  }

  if (product.lead_time?.trim()) {
    return product.lead_time.trim();
  }

  const leadTimeMeta = readMetaValue(product.meta_data, PRE_ORDER_LEAD_TIME_KEYS);
  if (leadTimeMeta) {
    return leadTimeMeta;
  }

  return isPreOrderProduct(product) ? PRE_ORDER_DEFAULT_LEAD_TIME : null;
}

export function resolveProductOrderType(
  product: ProductLike | null | undefined
): ProductOrderType {
  if (isPreOrderProduct(product)) {
    return "pre_order";
  }

  if (product?.product_order_type) {
    return product.product_order_type;
  }

  if (product?.order_type) {
    return product.order_type;
  }

  if (product?.stock_status === "instock") {
    return "in_stock";
  }

  if (
    product?.stock_status === "outofstock" ||
    product?.stock_status === "onbackorder"
  ) {
    return "special_order";
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
      lead: `Delivery: ${resolveProductLeadTime(product) ?? PRE_ORDER_DEFAULT_LEAD_TIME}`,
    };
  }

  return {
    type: "special",
    label: "Special Order",
    lead: "Delivery: 10-12 days",
  };
}

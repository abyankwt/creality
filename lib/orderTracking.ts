type TaxonomyTermLike = {
  slug?: string | null;
  name?: string | null;
};

export type TrackableOrderProduct = {
  stock_status?: string | null;
  categories?: TaxonomyTermLike[] | null;
  tags?: TaxonomyTermLike[] | null;
};

export type OrderTrackingType = "preorder" | "in_stock" | "special_order";

export type OrderTrackingSummary = {
  type: OrderTrackingType;
  estimated_days: number | null;
  days_left: number | null;
  delivery_message: string;
  show_countdown: boolean;
  timeline_step: number;
};

const PREORDER_ESTIMATE_DAYS = 45;
const SPECIAL_ORDER_ESTIMATE_DAYS = 15;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TERMINAL_ORDER_STATUSES = new Set([
  "completed",
  "cancelled",
  "refunded",
  "failed",
]);

function normalizeToken(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesAnyToken(
  value: string | null | undefined,
  tokens: readonly string[]
) {
  const normalized = normalizeToken(value);
  return tokens.some((token) => normalized.includes(token));
}

function listHasToken(
  terms: TaxonomyTermLike[] | null | undefined,
  tokens: readonly string[]
) {
  return Boolean(
    terms?.some(
      (term) => matchesAnyToken(term.slug, tokens) || matchesAnyToken(term.name, tokens)
    )
  );
}

function isPreOrderTaggedProduct(product: TrackableOrderProduct | null | undefined) {
  return (
    listHasToken(product?.categories, ["preorder"]) ||
    listHasToken(product?.tags, ["preorder"])
  );
}

function isUsedTaggedProduct(product: TrackableOrderProduct | null | undefined) {
  return (
    listHasToken(product?.categories, ["used"]) ||
    listHasToken(product?.tags, ["used"])
  );
}

export function resolveTrackedProductType(
  product: TrackableOrderProduct | null | undefined
): OrderTrackingType {
  if (isPreOrderTaggedProduct(product)) {
    return "preorder";
  }

  if (isUsedTaggedProduct(product)) {
    return "in_stock";
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

  return "in_stock";
}

export function resolveOrderTrackingType(
  products: Array<TrackableOrderProduct | null | undefined>
): OrderTrackingType {
  const resolvedTypes = products.map((product) => resolveTrackedProductType(product));

  if (resolvedTypes.includes("preorder")) {
    return "preorder";
  }

  if (resolvedTypes.includes("special_order")) {
    return "special_order";
  }

  return "in_stock";
}

function resolveEstimatedDays(type: OrderTrackingType) {
  if (type === "preorder") {
    return PREORDER_ESTIMATE_DAYS;
  }

  if (type === "special_order") {
    return SPECIAL_ORDER_ESTIMATE_DAYS;
  }

  return null;
}

function resolveBaseDeliveryMessage(type: OrderTrackingType) {
  if (type === "preorder") {
    return "Estimated delivery in 45 days";
  }

  if (type === "special_order") {
    return "Estimated delivery in 10-15 days";
  }

  return "Delivery within 24 hours";
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function calculateDaysLeft(
  orderDateValue: string,
  estimatedDays: number,
  today = new Date()
) {
  const orderDate = new Date(orderDateValue);
  if (Number.isNaN(orderDate.getTime())) {
    return estimatedDays;
  }

  const elapsedDays = Math.floor(
    (startOfDay(today).getTime() - startOfDay(orderDate).getTime()) / MS_PER_DAY
  );

  return Math.max(0, estimatedDays - Math.max(0, elapsedDays));
}

export function resolveOrderTimelineStep(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "completed" || normalizedStatus === "delivered") {
    return 3;
  }

  if (
    normalizedStatus === "shipped" ||
    normalizedStatus === "out-for-delivery" ||
    normalizedStatus === "out_for_delivery"
  ) {
    return 2;
  }

  if (normalizedStatus === "processing") {
    return 1;
  }

  return 0;
}

function resolveDeliveryMessageForStatus(
  status: string,
  type: OrderTrackingType
) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "completed" || normalizedStatus === "delivered") {
    return "Delivered";
  }

  if (normalizedStatus === "cancelled") {
    return "Order cancelled";
  }

  if (normalizedStatus === "refunded") {
    return "Order refunded";
  }

  if (normalizedStatus === "failed") {
    return "Delivery update unavailable";
  }

  return resolveBaseDeliveryMessage(type);
}

export function buildOrderTrackingSummary({
  date_created,
  status,
  products,
}: {
  date_created: string;
  status: string;
  products: Array<TrackableOrderProduct | null | undefined>;
}): OrderTrackingSummary {
  const type = resolveOrderTrackingType(products);
  const estimatedDays = resolveEstimatedDays(type);
  const showCountdown = Boolean(
    estimatedDays !== null && !TERMINAL_ORDER_STATUSES.has(status.toLowerCase())
  );

  return {
    type,
    estimated_days: estimatedDays,
    days_left:
      estimatedDays !== null && showCountdown
        ? calculateDaysLeft(date_created, estimatedDays)
        : null,
    delivery_message: resolveDeliveryMessageForStatus(status, type),
    show_countdown: showCountdown,
    timeline_step: resolveOrderTimelineStep(status),
  };
}

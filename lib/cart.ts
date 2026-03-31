/* ─────────────────────────────────────────────────────────────
 * lib/cart.ts — Client-side WooCommerce Store API cart helpers
 *
 * Every request goes through Next.js API proxy routes (/api/store/cart/…).
 * The Cart-Token is persisted in httpOnly cookies by the proxy,
 * so the cart survives page navigations.
 * ───────────────────────────────────────────────────────────── */

import type { ProductAvailability } from "@/lib/availability";

const NONCE_HEADER = "Nonce";

// ── In-memory nonce (refreshed from proxy response headers) ──
let nonce = "";

export function getNonce(): string {
  return nonce;
}

// ── Types ──

export type CartItemTotals = {
  line_subtotal: string;
  line_subtotal_tax: string;
  line_total: string;
  line_total_tax: string;
  line_total_html?: string;
  line_subtotal_html?: string;
};

export type CartItemImage = {
  id: number;
  src: string;
  thumbnail?: string;
  srcset?: string;
  sizes?: string;
  name?: string;
  alt?: string;
};

export type CartItem = {
  key: string;
  id: number;
  quantity: number;
  quantity_limits?: {
    minimum: number;
    maximum: number;
    multiple_of: number;
    editable: boolean;
  };
  name: string;
  short_description?: string;
  description?: string;
  sku?: string;
  permalink?: string;
  images: CartItemImage[];
  totals: CartItemTotals;
  prices?: {
    price: string;
    regular_price: string;
    sale_price: string;
    price_range?: { min_amount: string; max_amount: string } | null;
    raw_prices?: {
      precision: number;
      price: string;
      regular_price: string;
      sale_price: string;
    };
    currency_code?: string;
    currency_symbol?: string;
    currency_minor_unit?: number;
    currency_decimal_separator?: string;
    currency_thousand_separator?: string;
    currency_prefix?: string;
    currency_suffix?: string;
  };
  availability?: ProductAvailability;
};

export type CartTotals = {
  total_items: string;
  total_items_tax: string;
  total_fees: string;
  total_fees_tax: string;
  total_discount: string;
  total_discount_tax: string;
  total_shipping: string;
  total_shipping_tax: string;
  total_price: string;
  total_tax: string;
  total_price_html?: string;
  total_items_html?: string;
  total_shipping_html?: string;
  tax_lines?: Array<{ name: string; price: string; rate: string }>;
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
};

export type CartResponse = {
  items: CartItem[];
  items_count: number;
  items_weight: number;
  totals: CartTotals;
  coupons: Array<{
    code: string;
    discount: string;
    discount_tax: string;
    totals?: { total_discount: string; total_discount_tax: string };
  }>;
  needs_payment: boolean;
  needs_shipping: boolean;
  shipping_address?: Record<string, string>;
  billing_address?: Record<string, string>;
  errors?: Array<{ code: string; message: string }>;
};

const EMPTY_CART: CartResponse = {
  items: [],
  items_count: 0,
  items_weight: 0,
  totals: {
    total_items: "0",
    total_items_tax: "0",
    total_fees: "0",
    total_fees_tax: "0",
    total_discount: "0",
    total_discount_tax: "0",
    total_shipping: "0",
    total_shipping_tax: "0",
    total_price: "0",
    total_tax: "0",
  },
  coupons: [],
  needs_payment: false,
  needs_shipping: false,
};

// ── Custom error class for cart conflicts ──

export class CartConflictError extends Error {
  /** The real cart state returned by WooCommerce inside the 409 response */
  cart: CartResponse | null;

  constructor(message: string, cart: CartResponse | null) {
    super(message);
    this.name = "CartConflictError";
    this.cart = cart;
  }
}

// ── Core fetch wrapper — routes through Next.js proxy ──

async function fetchStoreApi<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  // Use the local Next.js API proxy — this persists Cart-Token in cookies
  const proxyBase = "/api/store";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (nonce) {
    headers[NONCE_HEADER] = nonce;
  }

  const response = await fetch(`${proxyBase}/${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  // Capture nonce from proxy response for subsequent requests
  const responseNonce = response.headers.get(NONCE_HEADER);
  if (responseNonce) {
    nonce = responseNonce;
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `Store API error ${response.status}`;
    let embeddedCart: CartResponse | null = null;

    try {
      const err = JSON.parse(text);
      if (err?.message) message += `: ${err.message}`;
      else if (err?.error) message += `: ${err.error}`;

      // 409 responses include the real cart state in data.cart
      if (response.status === 409 && err?.data?.cart) {
        embeddedCart = err.data.cart as CartResponse;
      }
    } catch {
      if (text) message += `: ${text}`;
    }

    if (response.status === 409 && embeddedCart) {
      throw new CartConflictError(message, embeddedCart);
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

// ── Public API ──

export async function fetchCart(): Promise<CartResponse> {
  try {
    return await fetchStoreApi<CartResponse>("cart", { method: "GET" });
  } catch (error) {
    console.error("Cart fetch failed, returning empty cart.", error);
    return EMPTY_CART;
  }
}

export async function addToCart(
  productId: number,
  quantity: number
): Promise<CartResponse> {
  return fetchStoreApi<CartResponse>("cart/add-item", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, id: productId, quantity }),
  });
}

export async function updateCartItem(
  key: string,
  quantity: number
): Promise<CartResponse> {
  return fetchStoreApi<CartResponse>("cart/update-item", {
    method: "POST",
    body: JSON.stringify({ key, quantity }),
  });
}

export async function removeCartItem(
  key: string
): Promise<CartResponse> {
  return fetchStoreApi<CartResponse>("cart/remove-item", {
    method: "POST",
    body: JSON.stringify({ key }),
  });
}

// ── Checkout types ──

export type BillingAddress = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  address_1: string;
  address_2?: string;
  postcode?: string;
};

export type CheckoutPayload = {
  billing_address: BillingAddress;
  shipping_address?: Omit<BillingAddress, "email" | "phone">;
  payment_method: string;
  order_warning_acknowledged?: boolean;
};

export type CheckoutResult = {
  success: boolean;
  order_id: number;
  redirect_url: string;
  error?: string;
};

export async function submitCheckout(
  payload: CheckoutPayload
): Promise<CheckoutResult> {
  const response = await fetch("/api/store/checkout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `Checkout failed (${response.status})`);
  }

  return data as CheckoutResult;
}

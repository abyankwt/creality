export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type UserSession = {
  userId: number;
  email: string;
  name: string;
};

export type WooOrder = {
  id: number;
  status: string;
  date: string;
  total: string;
  currency: string;
};

export type WooAddress = {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
};

export type WooCustomer = {
  billing: WooAddress;
  shipping: WooAddress;
};

/* ---- Subscriptions (creality-recurring plugin) ---- */

export type Subscription = {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  frequency: "weekly" | "monthly";
  next_billing_date: string;
  status: "active" | "paused" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type SubscriptionAction = "pause" | "resume" | "cancel";

/* ---- Loyalty (creality-loyalty plugin) ---- */

export type LoyaltyPoints = {
  available_points: number;
  total_earned: number;
  total_used: number;
  tier: "bronze" | "silver" | "gold";
  tier_multiplier: number;
  lifetime_spend: number;
  next_tier: string | null;
  next_threshold: number | null;
};

export type RedeemResponse = {
  coupon_code: string;
  discount: string;
  discount_type: string;
  points_redeemed: number;
  remaining_points: number;
};

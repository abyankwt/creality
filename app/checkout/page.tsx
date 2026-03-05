"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ShieldCheck, CreditCard, Banknote, Clock, LogIn, UserPlus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { submitCheckout, type BillingAddress } from "@/lib/cart";

type AuthUser = { userId: number; name: string; email: string } | null;
type AuthMeResponse =
    | { authenticated: false }
    | { authenticated: true; user: { id: number; name: string; email: string } };

/* ── Payment gateway options ── */

const PAYMENT_METHODS = [
    {
        id: "hesabe",
        label: "Hesabe / KNET",
        description: "Pay with your KNET card",
        icon: CreditCard,
    },
    {
        id: "deema-pay",
        label: "Deema",
        description: "Pay with Deema",
        icon: Banknote,
    },
    {
        id: "taly_gateway",
        label: "Taly",
        description: "Buy Now, Pay Later",
        icon: Clock,
    },
] as const;

/* ── Default billing values ── */

const emptyBilling: BillingAddress = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country: "KW",
    state: "",
    city: "",
    address_1: "",
};

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, loading: cartLoading, itemCount } = useCart();

    const [billing, setBilling] = useState<BillingAddress>(emptyBilling);
    const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0].id);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* ── Auth state ── */
    const [user, setUser] = useState<AuthUser>(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/me", { credentials: "include" });
                if (res.ok) {
                    const data = (await res.json()) as AuthMeResponse;
                    if (data.authenticated) {
                        const sessionUser = {
                            userId: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                        };
                        setUser(sessionUser);
                        // Auto-fill billing from session
                        const nameParts = (sessionUser.name || "").split(" ");
                        setBilling((prev) => ({
                            ...prev,
                            first_name: prev.first_name || nameParts[0] || "",
                            last_name: prev.last_name || nameParts.slice(1).join(" ") || "",
                            email: prev.email || sessionUser.email || "",
                        }));
                    }
                }
            } catch {
                // Not logged in
            } finally {
                setAuthChecked(true);
            }
        };
        checkAuth();
    }, []);

    /* ── If cart is empty after loading, redirect to /store ── */
    useEffect(() => {
        if (!cartLoading && cart && cart.items.length === 0) {
            router.replace("/store");
        }
    }, [cart, cartLoading, router]);

    /* ── Helpers ── */

    const decodeHtml = (html: string) => {
        if (typeof document === "undefined") return html;
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    const formatPrice = (minorUnits: string, decimals = 3) => {
        const num = Number(minorUnits) / Math.pow(10, decimals);
        return num.toFixed(decimals).replace(/\.?0+$/, "");
    };

    const currency =
        cart?.totals?.currency_symbol ??
        cart?.totals?.currency_prefix ??
        "KD";

    const minorUnit = cart?.totals?.currency_minor_unit ?? 3;

    /* ── Handle field changes ── */

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBilling((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    /* ── Submit checkout ── */

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const result = await submitCheckout({
                billing_address: billing,
                payment_method: paymentMethod,
            });

            if (result.redirect_url) {
                window.location.href = result.redirect_url;
            } else {
                router.push(`/order-success?order=${result.order_id}`);
            }
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Checkout failed. Please try again.";
            setError(msg);
            setSubmitting(false);
        }
    };

    /* ── Loading skeleton ── */
    if (!cart && cartLoading) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900">
                    Checkout
                </h1>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-20 animate-pulse rounded-xl bg-gray-100"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) return null;

    if (!authChecked) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900">
                    Checkout
                </h1>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-20 animate-pulse rounded-xl bg-gray-100"
                        />
                    ))}
                </div>
            </div>
        );
    }

    /* ── Auth gate — must be logged in ── */
    if (authChecked && !user) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
                    Checkout
                </h1>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Please log in to continue
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        You need an account to place an order. This lets you track your orders, reorder items, and manage your account.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                            href="/login?redirect=/checkout"
                            className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            <LogIn className="h-4 w-4" />
                            Log In
                        </Link>
                        <Link
                            href="/register?redirect=/checkout"
                            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            <UserPlus className="h-4 w-4" />
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const items = cart.items;

    return (
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
            <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900">
                Checkout
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* ── Order Summary ── */}
                <section>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Order Summary
                    </h2>
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                        {items.map((item) => {
                            const imageSrc =
                                item.images?.[0]?.thumbnail ||
                                item.images?.[0]?.src ||
                                "/placeholder.png";
                            const lineTotal = formatPrice(
                                item.totals?.line_total ?? "0",
                                minorUnit
                            );

                            return (
                                <div
                                    key={item.key}
                                    className="flex items-center gap-4 px-4 py-3"
                                >
                                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                                        <Image
                                            src={imageSrc}
                                            alt={decodeHtml(item.name)}
                                            fill
                                            sizes="56px"
                                            className="object-contain p-1"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                            {decodeHtml(item.name)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Qty: {item.quantity}
                                        </p>
                                    </div>
                                    <p className="whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {currency} {lineTotal}
                                    </p>
                                </div>
                            );
                        })}

                        {/* Totals row */}
                        <div className="space-y-2 bg-gray-50 px-4 py-4">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal ({itemCount} items)</span>
                                <span className="font-medium text-gray-900">
                                    {currency}{" "}
                                    {formatPrice(
                                        cart.totals?.total_items ?? "0",
                                        minorUnit
                                    )}
                                </span>
                            </div>
                            {Number(cart.totals?.total_shipping ?? 0) > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Shipping</span>
                                    <span className="font-medium text-gray-900">
                                        {currency}{" "}
                                        {formatPrice(
                                            cart.totals.total_shipping,
                                            minorUnit
                                        )}
                                    </span>
                                </div>
                            )}
                            {Number(cart.totals?.total_discount ?? 0) > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount</span>
                                    <span className="font-medium">
                                        -{currency}{" "}
                                        {formatPrice(
                                            cart.totals.total_discount,
                                            minorUnit
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="border-t border-gray-200 pt-2">
                                <div className="flex justify-between text-base font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>
                                        {currency}{" "}
                                        {formatPrice(
                                            cart.totals?.total_price ?? "0",
                                            minorUnit
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Billing Address ── */}
                <section>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Billing Details
                    </h2>
                    <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="first_name"
                                className="mb-1 block text-xs font-medium text-gray-700"
                            >
                                First Name *
                            </label>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                required
                                value={billing.first_name}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="last_name"
                                className="mb-1 block text-xs font-medium text-gray-700"
                            >
                                Last Name *
                            </label>
                            <input
                                id="last_name"
                                name="last_name"
                                type="text"
                                required
                                value={billing.last_name}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="email"
                                className="mb-1 block text-xs font-medium text-gray-700"
                            >
                                Email *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={billing.email}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="phone"
                                className="mb-1 block text-xs font-medium text-gray-700"
                            >
                                Phone *
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                value={billing.phone}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="country"
                                className="mb-1 block text-xs font-medium text-gray-700"
                            >
                                Country
                            </label>
                            <input
                                id="country"
                                name="country"
                                type="text"
                                value="Kuwait"
                                disabled
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 outline-none"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="city"
                                className="mb-1 block text-xs font-medium text-gray-700"
                            >
                                City *
                            </label>
                            <input
                                id="city"
                                name="city"
                                type="text"
                                required
                                value={billing.city}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="postcode"
                                className="mb-1 block text-xs font-medium text-gray-700"
                            >
                                Postcode / ZIP *
                            </label>
                            <input
                                id="postcode"
                                name="postcode"
                                type="text"
                                required
                                value={billing.postcode ?? ""}
                                onChange={handleChange}
                                placeholder="e.g. 12345"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="address_1"
                                className="mb-1 block text-xs font-medium text-gray-700"
                            >
                                Address *
                            </label>
                            <input
                                id="address_1"
                                name="address_1"
                                type="text"
                                required
                                value={billing.address_1}
                                onChange={handleChange}
                                placeholder="Street address, building, floor"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Payment Method ── */}
                <section>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Payment Method
                    </h2>
                    <div className="space-y-3">
                        {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon;
                            const selected = paymentMethod === method.id;
                            return (
                                <label
                                    key={method.id}
                                    className={`flex cursor-pointer items-center gap-4 rounded-xl border px-5 py-4 transition ${selected
                                        ? "border-black bg-gray-50 ring-1 ring-black"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value={method.id}
                                        checked={selected}
                                        onChange={() =>
                                            setPaymentMethod(method.id)
                                        }
                                        className="sr-only"
                                    />
                                    <div
                                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${selected
                                            ? "border-black"
                                            : "border-gray-300"
                                            }`}
                                    >
                                        {selected && (
                                            <div className="h-2.5 w-2.5 rounded-full bg-black" />
                                        )}
                                    </div>
                                    <Icon className="h-5 w-5 text-gray-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {method.label}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {method.description}
                                        </p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </section>

                {/* ── Error banner ── */}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* ── Place Order ── */}
                <div className="space-y-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-8 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing…
                            </>
                        ) : (
                            <>
                                Place Order — {currency}{" "}
                                {formatPrice(
                                    cart.totals?.total_price ?? "0",
                                    minorUnit
                                )}
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Secure checkout — you'll be redirected to the payment gateway</span>
                    </div>

                    <Link
                        href="/cart"
                        className="block text-center text-sm text-gray-500 transition hover:text-gray-700"
                    >
                        ← Back to Cart
                    </Link>
                </div>
            </form>
        </div>
    );
}

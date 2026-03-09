"use client";

import { useEffect, useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    ShoppingCart,
    Truck,
} from "lucide-react";
import SmartImage from "@/components/SmartImage";
import { addToCart } from "@/lib/cart";
import type { ApiResponse, WooOrder } from "@/lib/types";

type LoadState =
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; orders: WooOrder[] };

const statusColors: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
    refunded: "bg-gray-100 text-gray-600 border-gray-200",
    failed: "bg-red-50 text-red-600 border-red-200",
    "on-hold": "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export default function OrdersSection() {
    const [state, setState] = useState<LoadState>({ status: "loading" });
    const [expanded, setExpanded] = useState<number | null>(null);
    const [reordering, setReordering] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const response = await fetch("/api/account/orders", {
                    cache: "no-store",
                });
                const data = (await response.json()) as ApiResponse<WooOrder[]>;

                if (!response.ok || !data.success) {
                    if (active) {
                        setState({
                            status: "error",
                            message: data.success
                                ? "Unable to load orders."
                                : data.error,
                        });
                    }
                    return;
                }

                if (active) {
                    setState({ status: "success", orders: data.data });
                }
            } catch (error) {
                if (active) {
                    setState({
                        status: "error",
                        message:
                            error instanceof Error
                                ? error.message
                                : "Unable to load orders.",
                    });
                }
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    const handleReorder = async (order: WooOrder) => {
        if (!order.line_items?.length) return;

        try {
            setReordering(order.id);
            setFeedback(null);
            for (const item of order.line_items) {
                await addToCart(item.product_id, item.quantity);
            }
            setFeedback(`Order #${order.id} items added to cart.`);
        } catch (error) {
            setFeedback(
                error instanceof Error
                    ? error.message
                    : "Unable to add items to cart."
            );
        } finally {
            setReordering(null);
        }
    };

    return (
        <div className="space-y-4">
            {feedback && (
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                    {feedback}
                </div>
            )}

            {state.status === "loading" && (
                <div className="space-y-3">
                    {[1, 2, 3].map((index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-5"
                        >
                            <div className="h-4 w-24 rounded bg-gray-200" />
                            <div className="mt-3 h-5 w-32 rounded bg-gray-200" />
                            <div className="mt-2 h-3 w-40 rounded bg-gray-200" />
                        </div>
                    ))}
                </div>
            )}

            {state.status === "error" && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                    {state.message}
                </div>
            )}

            {state.status === "success" && state.orders.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
                    No orders yet. Your purchase history will appear here.
                </div>
            )}

            {state.status === "success" && state.orders.length > 0 && (
                <div className="space-y-3">
                    {state.orders.map((order) => {
                        const isExpanded = expanded === order.id;
                        return (
                            <div
                                key={order.id}
                                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExpanded((current) =>
                                            current === order.id ? null : order.id
                                        )
                                    }
                                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-gray-50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-semibold text-gray-900">
                                                #{order.id}
                                            </p>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                                                    statusColors[order.status] ??
                                                    "bg-gray-50 text-gray-600 border-gray-200"
                                                }`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                            <span>{formatDate(order.date)}</span>
                                            <span>
                                                {order.currency} {order.total}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Truck className="h-3.5 w-3.5" />
                                                Tracking status: {order.status}
                                            </span>
                                        </div>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                                        <div className="space-y-3">
                                            {(order.line_items ?? []).map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
                                                >
                                                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                                                        <SmartImage
                                                            src={
                                                                item.image?.src ??
                                                                "/images/product-placeholder.svg"
                                                            }
                                                            alt={item.name}
                                                            mode="product"
                                                            sizes="48px"
                                                            className="rounded-none"
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-gray-900">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Qty: {item.quantity}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {order.currency} {item.total}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleReorder(order)}
                                            disabled={reordering === order.id}
                                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            <ShoppingCart className="h-3.5 w-3.5" />
                                            {reordering === order.id
                                                ? "Adding..."
                                                : "Reorder Items"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

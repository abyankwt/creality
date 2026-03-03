"use client";

import { useEffect, useState } from "react";
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
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export default function OrdersSection() {
    const [state, setState] = useState<LoadState>({ status: "loading" });

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await fetch("/api/account/orders", { cache: "no-store" });
                const data = (await res.json()) as ApiResponse<WooOrder[]>;
                if (!res.ok || !data.success) {
                    if (active) setState({ status: "error", message: data.success ? "Unable to load orders." : data.error });
                    return;
                }
                if (active) setState({ status: "success", orders: data.data });
            } catch (err) {
                if (active) setState({ status: "error", message: err instanceof Error ? err.message : "Unable to load orders." });
            }
        })();
        return () => { active = false; };
    }, []);

    const handleReorder = async (orderId: number) => {
        const checkoutUrl = process.env.NEXT_PUBLIC_WC_BASE_URL?.replace(/\/$/, "");
        if (checkoutUrl) {
            window.location.href = `${checkoutUrl}/cart/?reorder=${orderId}`;
        }
    };

    return (
        <div className="space-y-4">
            {/* Skeleton */}
            {state.status === "loading" && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-5">
                            <div className="h-4 w-24 rounded bg-gray-200" />
                            <div className="mt-3 h-5 w-32 rounded bg-gray-200" />
                            <div className="mt-2 h-3 w-40 rounded bg-gray-200" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {state.status === "error" && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                    {state.message}
                </div>
            )}

            {/* Empty */}
            {state.status === "success" && state.orders.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
                    No orders yet. Your purchase history will appear here.
                </div>
            )}

            {/* Orders list */}
            {state.status === "success" && state.orders.length > 0 && (
                <div className="space-y-3">
                    {state.orders.map((order) => (
                        <div
                            key={order.id}
                            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                    <p className="text-sm font-semibold text-gray-900">#{order.id}</p>
                                    <span
                                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusColors[order.status] ?? "bg-gray-50 text-gray-600 border-gray-200"
                                            }`}
                                    >
                                        {order.status}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">{formatDate(order.date)}</p>
                                <p className="mt-1 text-base font-semibold text-gray-900">
                                    {order.currency} {order.total}
                                </p>
                            </div>
                            <button
                                onClick={() => handleReorder(order.id)}
                                className="shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
                            >
                                Reorder
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

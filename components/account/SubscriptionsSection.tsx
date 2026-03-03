"use client";

import { useEffect, useState } from "react";
import type { ApiResponse, Subscription, SubscriptionAction } from "@/lib/types";

type LoadState =
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; subscriptions: Subscription[] };

const statusStyle: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paused: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
};

const formatDate = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export default function SubscriptionsSection() {
    const [state, setState] = useState<LoadState>({ status: "loading" });
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const load = async () => {
        try {
            const res = await fetch("/api/account/subscriptions", { cache: "no-store" });
            const data = (await res.json()) as ApiResponse<Subscription[]>;
            if (!res.ok || !data.success) {
                setState({ status: "error", message: data.success ? "Unable to load subscriptions." : data.error });
                return;
            }
            setState({ status: "success", subscriptions: data.data });
        } catch (err) {
            setState({ status: "error", message: err instanceof Error ? err.message : "Unable to load subscriptions." });
        }
    };

    useEffect(() => { load(); }, []);

    const handleAction = async (id: number, action: SubscriptionAction) => {
        const key = `${id}-${action}`;
        setLoadingAction(key);

        // Optimistic update
        if (state.status === "success") {
            const optimistic = state.subscriptions.map((s) => {
                if (s.id !== id) return s;
                const newStatus = action === "pause" ? "paused" : action === "resume" ? "active" : "cancelled";
                return { ...s, status: newStatus } as Subscription;
            });
            setState({ status: "success", subscriptions: optimistic });
        }

        try {
            const res = await fetch(`/api/account/subscriptions/${id}/${action}`, { method: "POST" });
            if (!res.ok) {
                // Revert on failure
                await load();
            }
        } catch {
            await load();
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Skeleton */}
            {state.status === "loading" && (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-5">
                            <div className="h-4 w-40 rounded bg-gray-200" />
                            <div className="mt-3 h-3 w-24 rounded bg-gray-200" />
                            <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
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
            {state.status === "success" && state.subscriptions.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
                    No subscriptions yet. Subscribe to products for automatic recurring orders.
                </div>
            )}

            {/* Subscriptions list */}
            {state.status === "success" && state.subscriptions.length > 0 && (
                <div className="space-y-3">
                    {state.subscriptions.map((sub) => (
                        <div key={sub.id} className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-900">{sub.product_name}</p>
                                        <span
                                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusStyle[sub.status] ?? "bg-gray-50 text-gray-600 border-gray-200"
                                                }`}
                                        >
                                            {sub.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                        <span className="capitalize">{sub.frequency}</span>
                                        <span>Next: {formatDate(sub.next_billing_date)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {sub.status !== "cancelled" && (
                                    <div className="flex shrink-0 gap-2">
                                        {sub.status === "active" && (
                                            <button
                                                onClick={() => handleAction(sub.id, "pause")}
                                                disabled={loadingAction === `${sub.id}-pause`}
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Pause
                                            </button>
                                        )}
                                        {sub.status === "paused" && (
                                            <button
                                                onClick={() => handleAction(sub.id, "resume")}
                                                disabled={loadingAction === `${sub.id}-resume`}
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Resume
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleAction(sub.id, "cancel")}
                                            disabled={loadingAction === `${sub.id}-cancel`}
                                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

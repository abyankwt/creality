"use client";

import { useEffect, useState } from "react";
import type { ApiResponse, LoyaltyPoints, RedeemResponse } from "@/lib/types";

type LoadState =
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; data: LoyaltyPoints };

const tierColors: Record<string, { bg: string; text: string; bar: string }> = {
    bronze: { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-400" },
    silver: { bg: "bg-gray-100", text: "text-gray-700", bar: "bg-gray-400" },
    gold: { bg: "bg-yellow-50", text: "text-yellow-700", bar: "bg-yellow-500" },
};

export default function LoyaltySection() {
    const [state, setState] = useState<LoadState>({ status: "loading" });
    const [redeemInput, setRedeemInput] = useState("");
    const [redeemState, setRedeemState] = useState<
        | { status: "idle" }
        | { status: "loading" }
        | { status: "success"; data: RedeemResponse }
        | { status: "error"; message: string }
    >({ status: "idle" });
    const [copied, setCopied] = useState(false);

    const load = async () => {
        try {
            const res = await fetch("/api/account/loyalty", { cache: "no-store" });
            const body = (await res.json()) as ApiResponse<LoyaltyPoints>;
            if (!res.ok || !body.success) {
                setState({ status: "error", message: body.success ? "Unable to load points." : body.error });
                return;
            }
            setState({ status: "success", data: body.data });
        } catch (err) {
            setState({ status: "error", message: err instanceof Error ? err.message : "Unable to load points." });
        }
    };

    useEffect(() => { load(); }, []);

    const handleRedeem = async () => {
        const pts = parseInt(redeemInput, 10);
        if (!pts || pts <= 0) return;
        setRedeemState({ status: "loading" });

        try {
            const res = await fetch("/api/account/loyalty", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ points_to_redeem: pts }),
            });
            const body = (await res.json()) as ApiResponse<RedeemResponse>;
            if (!res.ok || !body.success) {
                setRedeemState({ status: "error", message: body.success ? "Redemption failed." : body.error });
                return;
            }
            setRedeemState({ status: "success", data: body.data });
            setRedeemInput("");
            // Reload points
            await load();
        } catch (err) {
            setRedeemState({ status: "error", message: err instanceof Error ? err.message : "Redemption failed." });
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Progress to next tier
    const calcProgress = (data: LoyaltyPoints) => {
        if (!data.next_threshold) return 100;
        const currentThreshold =
            data.tier === "silver" ? data.next_threshold * 0.2 :
                data.tier === "bronze" ? 0 : 0;
        const range = data.next_threshold - currentThreshold;
        if (range <= 0) return 100;
        return Math.min(100, Math.round(((data.lifetime_spend - currentThreshold) / range) * 100));
    };

    return (
        <div className="space-y-5">
            {/* Skeleton */}
            {state.status === "loading" && (
                <div className="animate-pulse space-y-4">
                    <div className="h-24 rounded-xl bg-gray-100" />
                    <div className="h-8 w-48 rounded bg-gray-100" />
                    <div className="h-4 w-full rounded bg-gray-100" />
                </div>
            )}

            {/* Error */}
            {state.status === "error" && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                    {state.message}
                </div>
            )}

            {/* Points summary */}
            {state.status === "success" && (
                <>
                    {/* Points cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Available</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{state.data.available_points.toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Earned</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{state.data.total_earned.toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Used</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{state.data.total_used.toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Multiplier</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{state.data.tier_multiplier}×</p>
                        </div>
                    </div>

                    {/* Tier progress */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${tierColors[state.data.tier]?.bg ?? "bg-gray-50"
                                        } ${tierColors[state.data.tier]?.text ?? "text-gray-600"}`}
                                >
                                    {state.data.tier}
                                </span>
                                <span className="text-xs text-gray-400">Tier</span>
                            </div>
                            {state.data.next_tier && (
                                <p className="text-xs text-gray-500">
                                    Next: <span className="font-semibold capitalize">{state.data.next_tier}</span> at{" "}
                                    {state.data.next_threshold?.toLocaleString()} KWD
                                </p>
                            )}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${tierColors[state.data.tier]?.bar ?? "bg-gray-400"
                                    }`}
                                style={{ width: `${calcProgress(state.data)}%` }}
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-400">
                            Lifetime spend: {state.data.lifetime_spend.toLocaleString()} KWD
                        </p>
                    </div>

                    {/* Redeem form */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-sm font-semibold text-gray-900">Redeem Points</p>
                        <p className="mt-1 text-xs text-gray-500">Exchange points for a discount coupon.</p>
                        <div className="mt-3 flex gap-2">
                            <input
                                type="number"
                                min={1}
                                max={state.data.available_points}
                                value={redeemInput}
                                onChange={(e) => setRedeemInput(e.target.value)}
                                placeholder="Points to redeem"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                            />
                            <button
                                onClick={handleRedeem}
                                disabled={redeemState.status === "loading" || !redeemInput}
                                className="shrink-0 rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                            >
                                {redeemState.status === "loading" ? "..." : "Redeem"}
                            </button>
                        </div>

                        {/* Redeem error */}
                        {redeemState.status === "error" && (
                            <p className="mt-2 text-xs text-red-600">{redeemState.message}</p>
                        )}

                        {/* Coupon result */}
                        {redeemState.status === "success" && (
                            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                <p className="text-xs font-semibold text-emerald-700">Coupon generated!</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <code className="rounded bg-white px-3 py-1.5 text-sm font-bold tracking-wider text-gray-900 border border-emerald-200">
                                        {redeemState.data.coupon_code}
                                    </code>
                                    <button
                                        onClick={() => copyCode(redeemState.data.coupon_code)}
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                    >
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                                <p className="mt-1.5 text-xs text-emerald-600">
                                    Discount: {redeemState.data.discount} · {redeemState.data.points_redeemed} pts redeemed
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

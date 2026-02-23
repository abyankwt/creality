"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ApiResponse, WooOrder } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; orders: WooOrder[] };

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function OrdersClient() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/account/orders", { cache: "no-store" });
        const data = (await response.json()) as ApiResponse<WooOrder[]>;
        if (!response.ok || !data.success) {
          const message = data.success ? "Unable to load orders." : data.error;
          if (active) setState({ status: "error", message });
          return;
        }
        if (active) setState({ status: "success", orders: data.data });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load orders.";
        if (active) setState({ status: "error", message });
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Orders</h2>
        <p className="mt-2 text-sm text-gray-500">
          Track your recent purchases and their status.
        </p>
      </div>

      {state.status === "loading" && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          Loading your orders...
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {state.message}
        </div>
      )}

      {state.status === "success" && state.orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          No orders yet. Start shopping to see your order history here.
        </div>
      )}

      {state.status === "success" && state.orders.length > 0 && (
        <div className="space-y-3">
          {state.orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">Order #{order.id}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {order.currency} {order.total}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Placed on {formatDate(order.date)}
                </p>
              </div>
              <div className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
                {order.status}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/account"
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Back to dashboard
        </Link>
        <Link
          href="/account/addresses"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Manage addresses
        </Link>
      </div>
    </div>
  );
}

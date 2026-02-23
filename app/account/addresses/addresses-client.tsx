"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ApiResponse, WooAddress, WooCustomer } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; customer: WooCustomer };

type AddressKey = "billing" | "shipping";

const emptyAddress = (): WooAddress => ({
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  country: "",
  email: "",
  phone: "",
});

const fieldConfig: { key: keyof WooAddress; label: string; type?: string }[] = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "company", label: "Company" },
  { key: "address_1", label: "Address line 1" },
  { key: "address_2", label: "Address line 2" },
  { key: "city", label: "City" },
  { key: "state", label: "State/Region" },
  { key: "postcode", label: "Postal code" },
  { key: "country", label: "Country" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
];

export default function AddressesClient() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [saving, setSaving] = useState<null | AddressKey>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/account/customer", { cache: "no-store" });
        const data = (await response.json()) as ApiResponse<WooCustomer>;
        if (!response.ok || !data.success) {
          const errorMessage = data.success ? "Unable to load addresses." : data.error;
          if (active) setState({ status: "error", message: errorMessage });
          return;
        }
        const customer = data.data ?? { billing: emptyAddress(), shipping: emptyAddress() };
        if (active) setState({ status: "success", customer });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unable to load addresses.";
        if (active) setState({ status: "error", message: errorMessage });
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const updateField = (type: AddressKey, key: keyof WooAddress, value: string) => {
    if (state.status !== "success") return;
    const updated: WooCustomer = {
      ...state.customer,
      [type]: {
        ...state.customer[type],
        [key]: value,
      },
    };
    setState({ status: "success", customer: updated });
  };

  const handleSave = async (type: AddressKey) => {
    if (state.status !== "success") return;
    setSaving(type);
    setMessage(null);
    try {
      const response = await fetch("/api/account/customer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: state.customer[type] }),
      });
      const data = (await response.json()) as ApiResponse<WooCustomer>;
      if (!response.ok || !data.success) {
        const errorMessage = data.success ? "Unable to update address." : data.error;
        setMessage(errorMessage);
        return;
      }
      setState({ status: "success", customer: data.data });
      setMessage("Address updated.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to update address.";
      setMessage(errorMessage);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Addresses</h2>
        <p className="mt-2 text-sm text-gray-500">
          Keep your billing and shipping details ready for checkout.
        </p>
      </div>

      {state.status === "loading" && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          Loading address details...
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {state.message}
        </div>
      )}

      {state.status === "success" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {(["billing", "shipping"] as AddressKey[]).map((type) => (
            <div key={type} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {type === "billing" ? "Billing address" : "Shipping address"}
                </h3>
                <button
                  type="button"
                  onClick={() => handleSave(type)}
                  disabled={saving === type}
                  className="rounded-lg bg-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving === type ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="mt-4 grid gap-4">
                {fieldConfig.map((field) => (
                  <label key={field.key} className="text-xs font-semibold text-gray-500">
                    {field.label}
                    <input
                      type={field.type ?? "text"}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                      value={state.customer[type][field.key] ?? ""}
                      onChange={(event) => updateField(type, field.key, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          {message}
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
          href="/account/orders"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          View orders
        </Link>
      </div>
    </div>
  );
}

"use client";

import { AlertTriangle, ArrowRight, X } from "lucide-react";
import type { ProductAvailability } from "@/lib/productAvailability";

type OrderWarningModalProps = {
  open: boolean;
  availability: ProductAvailability;
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  secondaryLabel?: string;
  title?: string;
};

export default function OrderWarningModal({
  open,
  availability,
  acknowledged,
  onAcknowledgedChange,
  onClose,
  onConfirm,
  confirmLabel = "Continue",
  secondaryLabel = "Back",
  title = "Before checkout",
}: OrderWarningModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-warning-title"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-orange-100 p-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                Order policy
              </p>
              <h2 id="order-warning-title" className="mt-1 text-xl font-semibold text-gray-900">
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close warning"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">{availability.label}</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              This item is ordered specifically for you and cannot be canceled,
              replaced, or refunded before arrival.
            </p>
            <p className="mt-3 text-sm font-medium text-gray-700">
              Estimated lead time: {availability.leadTime}
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => onAcknowledgedChange(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <span>I understand and accept these terms.</span>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            {secondaryLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!acknowledged}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {confirmLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

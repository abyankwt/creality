"use client";

import Link from "next/link";
import { useState } from "react";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import OrderWarningModal from "@/components/OrderWarningModal";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/context/CartContext";
import {
  getProductAvailability,
  requiresOrderWarning,
} from "@/lib/productAvailability";
import type { Product } from "@/lib/woocommerce-types";

export type StoreProduct = Product;

type StoreProductCardProps = {
  product: StoreProduct;
};

const fallbackImage = "/images/product-placeholder.svg";

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").trim();

export default function StoreProductCard({ product }: StoreProductCardProps) {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);

  const resolvedImage = product.images?.[0]?.src ?? fallbackImage;
  const shortDescription = product.short_description
    ? stripHtml(product.short_description).slice(0, 72)
    : "Precision-ready hardware";
  const availability = getProductAvailability(product);
  const canAddToCart = Boolean(product.id && product.purchasable);

  const commitAddToCart = async () => {
    if (!canAddToCart || loading) return;

    try {
      setLoading(true);
      await addItem(product.id, 1);
      setAddedFeedback(true);
      window.setTimeout(() => setAddedFeedback(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!canAddToCart || loading) return;

    if (requiresOrderWarning(availability)) {
      setWarningAccepted(false);
      setWarningOpen(true);
      return;
    }

    if (availability.type === "available") {
      await commitAddToCart();
    }
  };

  return (
    <>
      <article className="product-card group flex h-full flex-col justify-between rounded-xl border border-gray-100 bg-white p-2 transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative overflow-hidden rounded-xl">
            <ProductImage
              src={resolvedImage}
              alt={product.name}
              className="transition duration-300 ease-out group-hover:scale-[1.02]"
            />
            <div className="absolute left-2 top-2">
              <AvailabilityBadge availability={availability} className="shadow-sm" />
            </div>
          </div>
        </Link>

        <div className="flex flex-1 flex-col pt-3">
          <div className="flex-1">
            <Link href={`/product/${product.slug}`}>
              <h3 className="line-clamp-2 min-h-[2.75rem] text-[14px] font-semibold leading-snug text-[#0b0b0b] transition hover:text-black/70 sm:text-[15px]">
                {product.name}
              </h3>
            </Link>
            <p className="mt-1 truncate text-[12px] text-gray-400">
              {shortDescription}
            </p>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-[16px] font-semibold text-[#0b0b0b] sm:text-[18px]">
              {product.formatted_price}
            </span>
          </div>

          {availability.leadTime && (
            <p className="mt-1 text-xs font-medium text-gray-500">
              Arrival in {availability.leadTime}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <Link
              href={`/product/${product.slug}`}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Learn More
            </Link>
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={availability.type === "unavailable" || loading || !canAddToCart}
              className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-150 active:scale-[0.98] ${
                availability.type === "unavailable" || !canAddToCart
                  ? "cursor-not-allowed border border-gray-200 text-gray-400"
                  : "bg-[#0b0b0b] text-white hover:bg-black/80"
              }`}
            >
              {loading ? "Adding..." : addedFeedback ? "Added" : availability.label}
            </button>
          </div>
        </div>
      </article>

      <OrderWarningModal
        open={warningOpen}
        availability={availability}
        acknowledged={warningAccepted}
        onAcknowledgedChange={setWarningAccepted}
        onClose={() => setWarningOpen(false)}
        onConfirm={async () => {
          setWarningOpen(false);
          await commitAddToCart();
        }}
        confirmLabel="Continue"
        secondaryLabel="Cancel"
      />
    </>
  );
}

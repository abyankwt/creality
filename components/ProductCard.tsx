"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import OrderWarningModal from "@/components/OrderWarningModal";
import { useCart } from "@/context/CartContext";
import {
  getProductAvailability,
  requiresOrderWarning,
} from "@/lib/productAvailability";

type ProductImageData = {
  src?: string | null;
  alt?: string | null;
};

type ProductTag = {
  name?: string | null;
  slug?: string | null;
};

type ProductCategory = {
  name?: string | null;
  slug?: string | null;
};

type ProductCardProps = {
  imageUrl?: string | null;
  product?: {
    id?: number | null;
    images?: ProductImageData[] | null;
    purchasable?: boolean | null;
    stock_status?: string | null;
    price?: number | null;
    tags?: ProductTag[] | null;
    categories?: ProductCategory[] | null;
  } | null;
  title: string;
  price: number;
  slug: string;
  onAddToCart?: () => void;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-KW", {
    style: "currency",
    currency: "KWD",
    minimumFractionDigits: 2,
  }).format(value);

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect fill='%23f3f4f6' width='600' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial,sans-serif' font-size='24'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ProductCard({
  imageUrl,
  product,
  title,
  price,
  slug,
  onAddToCart,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);

  const resolvedProduct =
    product ?? (imageUrl ? { images: [{ src: imageUrl }], price } : undefined);
  const resolvedImage = resolvedProduct?.images?.[0]?.src || fallbackImage;
  const availability = getProductAvailability({
    stock_status: resolvedProduct?.stock_status ?? "outofstock",
    categories: (resolvedProduct?.categories ?? []).map((category) => ({
      id: 0,
      name: category.name ?? category.slug ?? "",
      slug: category.slug ?? category.name ?? "",
      parent: 0,
    })),
    tags: (resolvedProduct?.tags ?? []).map((tag) => ({
      id: 0,
      name: tag.name ?? tag.slug ?? "",
      slug: tag.slug ?? tag.name ?? "",
    })),
  });
  const canAddToCart = Boolean(resolvedProduct?.id && resolvedProduct?.purchasable);

  const commitAddToCart = async () => {
    if (!resolvedProduct?.id || !canAddToCart) {
      return;
    }

    try {
      setLoading(true);
      await addItem(resolvedProduct.id, 1);
      setAddedFeedback(true);
      onAddToCart?.();
      window.setTimeout(() => setAddedFeedback(false), 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!canAddToCart || loading) {
      return;
    }

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
      <article className="product-card group h-full rounded-xl border border-gray-200 bg-white p-3 transition-all duration-200 hover:shadow-sm">
        <Link href={`/product/${slug}`} className="block" aria-label={`View ${title}`}>
          <div className="product-image-wrapper relative rounded-xl bg-[#f5f5f5]">
            <img
              src={resolvedImage}
              alt={title}
              className="transition duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute left-2 top-2 z-10">
              <AvailabilityBadge availability={availability} className="shadow-sm" />
            </div>
          </div>
        </Link>

        <div className="product-content flex flex-1 flex-col pt-3">
          <Link href={`/product/${slug}`} className="block">
            <h3 className="product-title min-h-[2.75rem] text-sm font-semibold leading-snug text-text">
              {title}
            </h3>
          </Link>

          <div className="mt-2">
            <span className="text-sm font-bold text-text sm:text-base">
              {formatPrice(price)}
            </span>
          </div>

          {availability.leadTime && (
            <p className="mt-1 text-[11px] font-medium text-gray-500">
              Arrival in {availability.leadTime}
            </p>
          )}

          <div className="product-actions mt-3">
            <Link
              href={`/product/${slug}`}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Learn More
            </Link>
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={availability.type === "unavailable" || loading || !canAddToCart}
              aria-disabled={availability.type === "unavailable" || loading || !canAddToCart}
              aria-label={`${availability.label} for ${title}`}
              className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition duration-150 ${
                availability.type === "unavailable" || !canAddToCart
                  ? "cursor-not-allowed border border-gray-200 bg-transparent text-gray-400"
                  : "bg-[#6BBE45] text-white hover:bg-[#5AA73C]"
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

"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OrderWarningModal from "@/components/OrderWarningModal";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/price";
import { getProductAvailability } from "@/lib/productLogic";
import type { Product } from "@/lib/woocommerce-types";

type ProductCardProps = {
  product: Product;
  onAddToCart?: () => void;
};

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect fill='%23f3f4f6' width='600' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial,sans-serif' font-size='24'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);

  const resolvedImage = product.images?.[0]?.src || fallbackImage;
  const availability = getProductAvailability(product);
  const canAddToCart = Boolean(product.id);
  const modalAvailability = {
    type: availability.type,
    label: availability.label,
    badge: availability.label,
    leadTime: availability.lead?.replace(/^Delivery:\s*/, "") ?? null,
  };

  useEffect(() => {
    console.log("Stock debug", {
      name: product.name,
      is_in_stock: product.is_in_stock,
      stock_status: product.stock_status,
      stock_quantity: product.stock_quantity,
    });
  }, [
    product.is_in_stock,
    product.name,
    product.stock_quantity,
    product.stock_status,
  ]);

  const commitAddToCart = async () => {
    if (!product.id || !canAddToCart) {
      router.push(`/product/${product.slug}`);
      return;
    }

    try {
      setLoading(true);
      await addItem(product.id, 1);
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
    if (loading) {
      return;
    }

    if (availability.type === "available") {
      await commitAddToCart();
      return;
    }

    router.push(`/product/${product.slug}`);
  };

  const handleSpecialOrderClick = () => {
    if (loading) {
      return;
    }

    setWarningAccepted(false);
    setWarningOpen(true);
  };

  return (
    <>
      <article className="product-card flex flex-col min-w-0 group relative h-full rounded-xl border border-gray-200 bg-white p-[10px] transition-all duration-200 hover:shadow-sm">
        {availability.type !== "available" && (
          <div className="product-badge absolute left-2 top-2 z-10 rounded-full bg-[#e5e7eb] px-[10px] py-1 text-[12px] text-gray-700">
            {availability.label}
          </div>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="block"
          aria-label={`View ${product.name}`}
        >
          <div className="product-image-wrapper relative rounded-xl bg-[#f5f5f5]">
            <img
              src={resolvedImage}
              alt={product.name}
              className="transition duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </Link>

        <div className="product-content flex flex-1 flex-col pt-3">
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="product-title min-h-[2.75rem] text-[14px] font-semibold leading-[1.3] text-text">
              {product.name}
            </h3>
          </Link>

          <div className="mt-2">
            <span className="text-sm font-bold text-text sm:text-base">
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="product-actions mt-3">
            {availability.type === "available" && (
              <button
                type="button"
                onClick={handlePrimaryAction}
                aria-label={`${availability.label} for ${product.name}`}
                className="btn-primary inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[#6BBE45] px-3 py-2 text-[13px] font-semibold text-white transition duration-150 hover:bg-[#5AA73C]"
              >
                {loading ? "Adding..." : addedFeedback ? "Added" : "Add to Cart"}
              </button>
            )}

            {availability.type === "special" && (
              <div className="special-order-block">
                <p className="stock-text mb-[6px] text-[13px] text-[#6b7280]">
                  Currently out of stock
                </p>

                <button
                  type="button"
                  onClick={handleSpecialOrderClick}
                  aria-label={`${availability.label} for ${product.name}`}
                  className="btn-special inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[#f97316] px-3 py-2 text-[13px] font-semibold text-white transition duration-150 hover:bg-[#ea580c]"
                >
                  Special Order
                </button>

                <p className="delivery-text mt-1 text-[12px] text-[#6b7280]">
                  Delivery 10-12 days
                </p>
              </div>
            )}

            {availability.type === "preorder" && (
              <div className="preorder-block">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  aria-label={`${availability.label} for ${product.name}`}
                  className="btn-secondary inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[#2563eb] px-3 py-2 text-[13px] font-semibold text-white transition duration-150 hover:bg-[#1d4ed8]"
                >
                  Pre-Order
                </button>

                <p className="delivery-text mt-1 text-[12px] text-[#6b7280]">
                  Delivery 30-45 days
                </p>
              </div>
            )}
          </div>
        </div>
      </article>

      <OrderWarningModal
        open={warningOpen}
        availability={modalAvailability}
        product={product}
        acknowledged={warningAccepted}
        onAcknowledgedChange={setWarningAccepted}
        onClose={() => setWarningOpen(false)}
        onConfirm={async () => {
          setWarningOpen(false);
          await commitAddToCart();
        }}
        confirmLabel="Add to cart"
        secondaryLabel="Back"
        title="Before you continue"
      />
    </>
  );
}

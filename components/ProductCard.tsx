"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import useCompare from "@/components/compare/useCompare";

type ProductImage = {
  src?: string | null;
  alt?: string | null;
};

type ProductCardProps = {
  imageUrl?: string | null;
  product?: {
    id?: number | null;
    images?: ProductImage[] | null;
    purchasable?: boolean | null;
    stock_status?: string | null;
    categories?: Array<{ slug?: string | null }> | null;
  } | null;
  title: string;
  price: number;
  slug: string;
  onAddToCart?: () => void;
  priority?: boolean;
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
  product = imageUrl ? { images: [{ src: imageUrl }] } : undefined,
  title,
  price,
  slug,
  onAddToCart,
  priority = false,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { isSelected, toggleItem, canAddMore } = useCompare();
  const [loading, setLoading] = useState<boolean>(false);
  const [compareError, setCompareError] = useState("");
  const resolvedImage = product?.images?.[0]?.src || fallbackImage;
  const resolvedAlt = title;
  const isAvailable = Boolean(
    product?.purchasable && product?.stock_status === "instock"
  );
  const isPrinter = useMemo(() => {
    const slugs: string[] =
      (product?.categories
        ?.map((category) => category.slug?.toLowerCase())
        .filter((s): s is string => typeof s === "string") ?? []);
    return slugs.some((slug) =>
      ["printer", "printers", "fdm", "resin", "k1", "ender", "cr", "halot"].some(
        (token) => slug.includes(token)
      )
    );
  }, [product?.categories]);
  const isCompared = product?.id ? isSelected(product.id) : false;
  const [addedFeedback, setAddedFeedback] = useState(false);

  const handleAddToCart = async (): Promise<void> => {
    if (!product?.id) {
      console.error("Missing product id for add to cart.");
      return;
    }

    try {
      setLoading(true);
      await addItem(product.id, 1);
      setAddedFeedback(true);
      onAddToCart?.();
      setTimeout(() => setAddedFeedback(false), 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    if (!product?.id) return;
    const response = toggleItem({
      id: product.id,
      name: title,
      image: resolvedImage,
    });
    if (!response.ok) {
      setCompareError(response.reason ?? "Compare limit reached.");
      window.setTimeout(() => setCompareError(""), 2000);
    }
  };

  return (
    <article className="group rounded-2xl border border-gray-200 bg-white p-2 transition-all duration-200 hover:shadow-sm">
      <Link href={`/product/${slug}`} className="block" aria-label={`View ${title}`}>
        <div className="relative mx-auto aspect-square w-full max-w-[140px] overflow-hidden rounded-xl bg-gray-100 md:max-w-[180px]">
          <Image
            src={resolvedImage}
            alt={resolvedAlt}
            fill
            sizes="(max-width: 419px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            loading={priority ? undefined : "lazy"}
            priority={priority}
          />
          {/* Stock badge — top right */}
          <div className="absolute right-1.5 top-1.5 z-10">
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold ${isAvailable ? "text-green-700" : "text-gray-500"
                }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-green-500" : "bg-gray-400"
                  }`}
              />
              {isAvailable ? "In stock" : "Out of stock"}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-2 pt-2">
        <div className="space-y-0.5">
          <p className="text-[9px] uppercase tracking-wide text-gray-400">
            Creality Kuwait
          </p>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-snug text-text sm:text-sm">{title}</h3>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text sm:text-base">
            {formatPrice(price)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isAvailable || loading}
          aria-disabled={!isAvailable || loading}
          aria-label={`Add ${title} to cart`}
          className={`mt-auto flex min-h-10 w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition duration-150 ${isAvailable
            ? "bg-[#6BBE45] text-white hover:bg-[#5AA73C]"
            : "cursor-not-allowed border border-gray-200 bg-transparent text-gray-400"
            }`}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" className="opacity-25" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Adding...
            </span>
          ) : addedFeedback ? "Added ✓" : "Add to cart"}
        </button>

        {isPrinter && product?.id && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={handleCompare}
              disabled={!isCompared && !canAddMore}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-700 transition duration-150 hover:border-gray-400 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              {isCompared ? "✓ Comparing" : "Compare"}
            </button>
            {compareError && (
              <p className="text-center text-[11px] text-amber-600">
                {compareError}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

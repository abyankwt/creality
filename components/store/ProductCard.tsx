"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

type StoreProductImage = {
  id?: number;
  src?: string | null;
  alt?: string | null;
};

export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  formatted_price?: string | null;
  price_html?: string | null;
  short_description?: string | null;
  purchasable: boolean;
  stock_status: string;
  images: StoreProductImage[];
};

type StoreProductCardProps = {
  product: StoreProduct;
};

const fallbackImage = "/images/product-placeholder.svg";

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").trim();

export default function StoreProductCard({ product }: StoreProductCardProps) {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const resolvedImage = product.images?.[0]?.src ?? fallbackImage;
  const shortDescription = product.short_description
    ? stripHtml(product.short_description)
    : "Precision-ready hardware";
  const isAvailable = product.purchasable && product.stock_status === "instock";
  const priceMarkup =
    product.formatted_price ?? product.price_html ?? product.price;

  const handleAddToCart = async () => {
    if (!product.id || !isAvailable || loading) {
      return;
    }

    try {
      setLoading(true);
      await addItem(product.id, 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="group flex h-full flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-gray-50">
          <Image
            src={resolvedImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 70vw, 25vw"
            className="object-cover transition duration-200 ease-out group-hover:scale-[1.02]"
          />
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col gap-3">
        <div>
          <h3 className="text-[16px] font-semibold text-[#0b0b0b]">
            {product.name}
          </h3>
          <p className="mt-1 truncate text-sm text-gray-500">
            {shortDescription}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span
            className="text-[20px] font-semibold text-[#0b0b0b]"
            dangerouslySetInnerHTML={{ __html: priceMarkup }}
          />
          <span className="text-xs text-gray-500">
            {isAvailable ? "In stock" : "Out of stock"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isAvailable || loading}
          className={`mt-auto w-full rounded-md px-4 py-2 text-sm font-semibold transition duration-200 active:scale-[0.98] ${
            isAvailable
              ? "bg-black text-white hover:bg-[#111111]"
              : "cursor-not-allowed border border-gray-200 text-gray-400"
          }`}
        >
          {loading ? "Adding..." : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

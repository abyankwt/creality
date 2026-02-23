"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import type { WCProduct } from "@/lib/api";

type ProductDetailProps = {
  product: WCProduct & {
    short_description?: string | null;
    stock_quantity?: number | null;
    related_ids?: number[] | null;
    attributes?: Array<{
      id: number;
      name: string;
      options: string[];
    }>;
    meta_data?: Array<{
      id?: number;
      key: string;
      value: string;
    }>;
  };
};

type RelatedProduct = WCProduct;

const extractVideoUrl = (meta: ProductDetailProps["product"]["meta_data"]) => {
  const entry = meta?.find((item) => item.key === "video_url" || item.key === "video");
  return entry?.value ?? "";
};

const getEmbedUrl = (url: string) => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const match =
      url.match(/v=([^&]+)/) ||
      url.match(/youtu\.be\/([^?]+)/) ||
      url.match(/embed\/([^?]+)/);
    const id = match?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }
  if (url.includes("vimeo.com")) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    const id = match?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : "";
  }
  return "";
};

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState<string>(
    product.images?.[0]?.src ?? "/placeholder.png"
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(true);

  const isAvailable =
    product.purchasable && product.stock_status === "instock";
  const mainImage = selectedImage || product.images?.[0]?.src || "/placeholder.png";
  const canAdd = useMemo(() => isAvailable && !adding, [isAvailable, adding]);
  const videoUrl = extractVideoUrl(product.meta_data);
  const embedUrl = getEmbedUrl(videoUrl);
  const priceHtml = product.formatted_price?.trim() || product.price_html?.trim();

  useEffect(() => {
    const ids = product.related_ids ?? [];
    if (!ids.length) {
      setRelatedProducts([]);
      return;
    }

    let isActive = true;
    const fetchRelated = async () => {
      try {
        setRelatedLoading(true);
        const response = await fetch(`/api/store/products?include=${ids.join(",")}`);
        const data = await response.json();
        const products = Array.isArray(data) ? data : data?.products ?? [];
        if (isActive) {
          setRelatedProducts(products.slice(0, 4));
        }
      } catch {
        if (isActive) {
          setRelatedProducts([]);
        }
      } finally {
        if (isActive) {
          setRelatedLoading(false);
        }
      }
    };

    void fetchRelated();
    return () => {
      isActive = false;
    };
  }, [product.related_ids]);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addItem(product.id, quantity);
    } catch {
      // Intentionally silent in production layout
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      setAdding(true);
      await addItem(product.id, quantity);
      window.location.href = "/cart";
    } catch {
      // Intentionally silent in production layout
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-12 sm:pt-16 lg:pb-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full bg-gray-100">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition duration-500 ease-out group-hover:scale-105"
                priority
              />
            </div>
          </div>

          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((image) => {
                const isActive = selectedImage === image.src;
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(image.src)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition ${
                      isActive ? "border-black" : "border-gray-200"
                    }`}
                    aria-label={`View ${product.name} image`}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt ?? product.name}
                      fill
                      sizes="80px"
                      className="object-cover transition duration-300"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Creality Kuwait
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              {product.name}
            </h1>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {priceHtml ? (
                <span dangerouslySetInnerHTML={{ __html: priceHtml }} />
              ) : (
                <span>{product.price}</span>
              )}
            </div>

            <div className="mt-3">
              {isAvailable ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                  In Stock
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                  Out of Stock
                </span>
              )}
            </div>

            {product.short_description && (
              <div
                className="prose prose-sm mt-4 max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="h-11 w-11 rounded-l-xl text-lg font-semibold text-gray-500 transition hover:text-black"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="min-w-[48px] text-center text-sm font-semibold text-text">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="h-11 w-11 rounded-r-xl text-lg font-semibold text-gray-500 transition hover:text-black"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAdd}
                className="w-full rounded-xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                {adding ? "Adding..." : "Add to cart"}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAdd}
                className="w-full rounded-xl border border-gray-200 bg-white px-6 py-4 text-sm font-semibold text-gray-900 transition hover:border-black disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Buy now
              </button>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-12 space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Description</h2>
          <div
            className="prose prose-sm mt-3 max-w-none text-gray-600"
            dangerouslySetInnerHTML={{ __html: product.description ?? "" }}
          />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={() => setSpecsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-900"
            aria-expanded={specsOpen}
          >
            Technical specifications
            <span className="text-lg">{specsOpen ? "−" : "+"}</span>
          </button>
          <div
            className="overflow-hidden transition-[max-height] duration-300 ease-out"
            style={{ maxHeight: specsOpen ? "600px" : "0px" }}
          >
            <div className="mt-4 space-y-4">
              {product.attributes && product.attributes.length > 0 ? (
                product.attributes.map((attribute) => (
                  <div key={attribute.id} className="flex flex-wrap gap-2">
                    <span className="w-40 text-sm font-semibold text-gray-900">
                      {attribute.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {attribute.options.join(", ")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Specifications will be added soon.
                </p>
              )}
            </div>
          </div>
        </div>

        {embedUrl && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Product video</h2>
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-gray-100">
              <iframe
                src={embedUrl}
                title={`${product.name} video`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-text">You may also like</h2>
        </div>
        {relatedLoading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading related products...
          </div>
        ) : relatedProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No related products available.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((related) => (
              <ProductCard
                key={related.id}
                imageUrl={related.images?.[0]?.src ?? ""}
                product={{
                  id: related.id,
                  images: related.images,
                  purchasable: related.purchasable,
                  stock_status: related.stock_status,
                }}
                title={related.name}
                price={Number(related.price)}
                slug={related.slug}
                onAddToCart={() => {}}
              />
            ))}
          </div>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
              Price
            </p>
            <div className="text-lg font-semibold text-gray-900">
              {priceHtml ? (
                <span dangerouslySetInnerHTML={{ __html: priceHtml }} />
              ) : (
                <span>{product.price}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAdd}
            className="flex-1 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {adding ? "Adding..." : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

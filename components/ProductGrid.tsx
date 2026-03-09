"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/woocommerce-types";

type ProductGridProps = {
    initialProducts: Product[];
    initialPage: number;
    totalPages: number;
};

export default function ProductGrid({
    initialProducts,
    initialPage,
    totalPages,
}: ProductGridProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialPage < totalPages);
    const [showToast, setShowToast] = useState(false);
    const toastTimerRef = useRef<number | null>(null);

    const handleAddedToCart = useCallback(() => {
        setShowToast(true);
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
            setShowToast(false);
        }, 1400);
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        const nextPage = page + 1;

        try {
            const res = await fetch(`/api/products?page=${nextPage}&per_page=12`);
            if (!res.ok) throw new Error("Failed to fetch products");

            const data = (await res.json()) as {
                products: Product[];
                pagination: { totalPages: number };
            };
            setProducts((prev) => [...prev, ...data.products]);
            setPage(nextPage);
            setHasMore(nextPage < data.pagination.totalPages);
        } catch (error) {
            console.error("Error loading more products:", error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page]);

    return (
        <>
            <div className="px-3 sm:px-0">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            imageUrl={product.images?.[0]?.src ?? ""}
                            title={product.name}
                            price={product.price}
                            slug={product.slug}
                            onAddToCart={handleAddedToCart}
                        />
                    ))}
                </div>
            </div>

            {hasMore && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="rounded-2xl border border-black px-8 py-3 text-sm font-semibold transition-all duration-300 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Loading...
                            </span>
                        ) : (
                            "Load more products"
                        )}
                    </button>
                </div>
            )}

            <div
                role="status"
                aria-live="polite"
                className={`pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 transition duration-200 ${
                    showToast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
            >
                <div className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-lg">
                    Added to cart
                </div>
            </div>
        </>
    );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/woocommerce-types";

type ProductGridProps = {
    initialProducts: Product[];
    initialPage: number;
    totalPages: number;
    apiQuery?: Record<string, string | number | undefined>;
    emptyMessage?: string;
};

export default function ProductGrid({
    initialProducts,
    initialPage,
    totalPages,
    apiQuery,
    emptyMessage = "No products found.",
}: ProductGridProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialPage < totalPages);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<"success" | "error">("success");
    const toastTimerRef = useRef<number | null>(null);
    const loadingPlaceholders = Array.from({ length: 4 }, (_, index) => index);

    const showToastMessage = useCallback(
        (message: string, type: "success" | "error" = "success") => {
            setToastMessage(message);
            setToastType(type);
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
            toastTimerRef.current = window.setTimeout(() => {
                setToastMessage(null);
            }, 1600);
        },
        []
    );

    const handleAddedToCart = useCallback((message?: string) => {
        showToastMessage(message ?? "Added to cart");
    }, [showToastMessage]);

    const handleAddToCartError = useCallback((message?: string) => {
        showToastMessage(message ?? "Unable to add item to cart", "error");
    }, [showToastMessage]);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setProducts(initialProducts);
        setPage(initialPage);
        setLoading(false);
        setHasMore(initialPage < totalPages);
        setToastMessage(null);
    }, [initialPage, initialProducts, totalPages]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        const nextPage = page + 1;

        try {
            const params = new URLSearchParams();
            params.set("page", String(nextPage));
            params.set("per_page", "12");

            Object.entries(apiQuery ?? {}).forEach(([key, value]) => {
                if (value !== undefined && value !== "") {
                    params.set(key, String(value));
                }
            });

            const res = await fetch(`/api/products?${params.toString()}`);
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
    }, [apiQuery, loading, hasMore, page]);

    return (
        <>
            <div className="px-3 sm:px-0">
                {products.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={handleAddedToCart}
                                onAddToCartError={handleAddToCartError}
                            />
                        ))}
                        {loading &&
                            loadingPlaceholders.map((placeholder) => (
                                <div
                                    key={`product-grid-skeleton-${placeholder}`}
                                    aria-hidden="true"
                                    className="animate-pulse rounded-xl border border-gray-200 bg-white p-[10px]"
                                >
                                    <div className="aspect-square rounded-xl bg-gray-100" />
                                    <div className="mt-3 space-y-2">
                                        <div className="h-4 w-full rounded bg-gray-100" />
                                        <div className="h-4 w-3/4 rounded bg-gray-100" />
                                    </div>
                                    <div className="mt-4 h-5 w-1/3 rounded bg-gray-100" />
                                    <div className="mt-4 h-10 rounded-lg bg-gray-100" />
                                </div>
                            ))}
                    </div>
                )}
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
                    toastMessage ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
            >
                <div
                    className={`rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg ${
                        toastType === "success" ? "bg-black" : "bg-red-600"
                    }`}
                >
                    {toastMessage}
                </div>
            </div>
        </>
    );
}

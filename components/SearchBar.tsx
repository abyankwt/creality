"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { searchProducts } from "@/lib/searchProducts";
import type { Product } from "@/lib/woocommerce-types";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        const products = await searchProducts(trimmed);
        if (active) {
          setResults(products.slice(0, 6));
          setOpen(true);
        }
      } catch (error) {
        if (active) {
          console.error("Search failed:", error);
          setResults([]);
          setOpen(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const hasResults = useMemo(() => results.length > 0, [results]);

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="w-full">
        <label htmlFor="search" className="sr-only">
          Search products
        </label>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          placeholder="Search products"
          className="h-11 w-full rounded-full border border-gray-200 bg-white px-5 text-sm text-text placeholder:text-gray-400 focus:border-black focus:outline-none"
          aria-label="Search products"
          autoComplete="off"
        />
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : hasResults ? (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-gray-50"
                >
                  <span className="line-clamp-2 font-medium text-gray-900">
                    {product.name}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">View</span>
                </Link>
              ))}
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full border-t border-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                View all results
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              No matching products found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

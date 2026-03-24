"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Search } from "lucide-react";
import { searchProducts } from "@/lib/searchProducts";
import type { Product } from "@/lib/woocommerce-types";

export default function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setOpen(false);
      return;
    }

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
  }, [expanded, query]);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [expanded]);

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
      setExpanded(false);
      setOpen(false);
    }
  };

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setExpanded(false);
    setOpen(false);
  };

  return (
    <div
      className="relative h-10 w-10 shrink-0"
      onBlurCapture={handleBlurCapture}
    >
      <form
        onSubmit={handleSubmit}
        className={`absolute right-0 top-1/2 z-20 -translate-y-1/2 overflow-hidden transition-all duration-300 ${
          expanded ? "w-[250px] opacity-100" : "w-0 opacity-0"
        }`}
      >
        <label htmlFor="search" className="sr-only">
          Search products
        </label>
        <input
          ref={inputRef}
          id="search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim()) {
              setOpen(true);
            }
          }}
          placeholder="Search products"
          className="h-10 w-[250px] rounded-full border border-gray-200 bg-white pl-4 pr-12 text-sm text-text placeholder:text-gray-400 focus:border-black focus:outline-none"
          aria-label="Search products"
          autoComplete="off"
          tabIndex={expanded ? 0 : -1}
        />
      </form>

      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="absolute right-0 top-1/2 z-30 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all duration-300 hover:border-gray-300 hover:text-[#0b0b0b]"
        aria-label="Search products"
      >
        <Search className="h-4 w-4" />
      </button>

      {expanded && open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : hasResults ? (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  prefetch
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

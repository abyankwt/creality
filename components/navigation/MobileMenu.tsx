"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CategoryNode } from "@/lib/categories";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  categories: CategoryNode[];
};

export default function MobileMenu({ open, onClose, categories }: MobileMenuProps) {
  const [active, setActive] = useState<number | null>(null);

  if (!open) return null;

  // Show parent categories that have children as accordions
  const parentCategories = categories.filter((c) => c.children.length > 0);
  // Standalone categories (no children) shown as direct links
  const standaloneCategories = categories.filter((c) => c.children.length === 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">
          Menu
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-200 p-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="h-[calc(100vh-65px)] overflow-y-auto px-5 pb-10 pt-5">
        {/* Top-level nav links */}
        <div className="space-y-1">
          <Link
            href="/store"
            className="block rounded-lg px-2 py-2 text-base font-semibold text-gray-900 transition hover:bg-gray-50"
            onClick={onClose}
          >
            All Products
          </Link>
          <Link
            href="/printing-service"
            className="block rounded-lg px-2 py-2 text-base font-semibold text-gray-900 transition hover:bg-gray-50"
            onClick={onClose}
          >
            Printing Service
          </Link>
          <Link
            href="/downloads"
            className="block rounded-lg px-2 py-2 text-base font-semibold text-gray-900 transition hover:bg-gray-50"
            onClick={onClose}
          >
            Downloads
          </Link>
          <Link
            href="/support"
            className="block rounded-lg px-2 py-2 text-base font-semibold text-gray-900 transition hover:bg-gray-50"
            onClick={onClose}
          >
            Support
          </Link>
        </div>

        {/* Category accordion */}
        {(parentCategories.length > 0 || standaloneCategories.length > 0) && (
          <div className="mt-4 space-y-1">
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
              Browse by category
            </p>

            {/* Accordion sections for parent categories */}
            {parentCategories.map((cat) => {
              const isOpen = active === cat.id;
              const estimatedHeight = cat.children.length * 44 + 16;

              return (
                <div
                  key={cat.id}
                  className="overflow-hidden rounded-xl border border-gray-100"
                >
                  <button
                    type="button"
                    onClick={() => setActive(isOpen ? null : cat.id)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                    aria-expanded={isOpen}
                  >
                    {cat.name}
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-[max-height] duration-300 ease-out"
                    style={{ maxHeight: isOpen ? `${estimatedHeight}px` : "0px" }}
                  >
                    <div className="border-t border-gray-100 px-4 py-3">
                      {/* View all link */}
                      <Link
                        href={`/category/${cat.slug}`}
                        className="mb-2 block text-sm font-medium text-[#7bbf6a] transition hover:text-[#5a9e4f]"
                        onClick={onClose}
                      >
                        View all {cat.name} →
                      </Link>
                      <div className="grid gap-1">
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="block py-1.5 text-sm text-gray-600 transition hover:text-gray-900"
                            onClick={onClose}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Standalone categories as direct links */}
            {standaloneCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="block rounded-xl border border-gray-100 px-4 py-3.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                onClick={onClose}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Account section */}
        <div className="mt-8 space-y-1 border-t border-gray-100 pt-6">
          <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
            Account
          </p>
          <Link
            href="/account"
            className="block rounded-lg px-2 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={onClose}
          >
            Dashboard
          </Link>
          <Link
            href="/account/orders"
            className="block rounded-lg px-2 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={onClose}
          >
            Orders
          </Link>
          <Link
            href="/api/store/checkout"
            className="block rounded-lg px-2 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={onClose}
          >
            Cart
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import type { NavGroup } from "@/config/store-navigation";
import { STORE_NAVIGATION } from "@/config/store-navigation";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const slugToLabel = (slug: string) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const flattenCategories = (group: NavGroup) => {
  const direct = group.categories ?? [];
  const nested = group.groups?.flatMap((child) => child.categories ?? []) ?? [];
  return [...new Set([...direct, ...nested])];
};

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const [active, setActive] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">
          Menu
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold text-gray-700"
        >
          Close
        </button>
      </div>

      <div className="h-[calc(100vh-64px)] overflow-y-auto px-5 pb-10 pt-6">
        <div className="space-y-3">
          <Link
            href="/store"
            className="block text-lg font-semibold text-gray-900"
            onClick={onClose}
          >
            Store
          </Link>
          <Link
            href="/printing-service"
            className="block text-lg font-semibold text-gray-900"
            onClick={onClose}
          >
            Printing Service
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {STORE_NAVIGATION.map((group) => {
            const isOpen = active === group.title;
            const categories = flattenCategories(group);
            return (
              <div key={group.title} className="rounded-2xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setActive(isOpen ? null : group.title)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-gray-800"
                  aria-expanded={isOpen}
                >
                  {group.title}
                  <span className="text-lg">{isOpen ? "−" : "+"}</span>
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-out"
                  style={{ maxHeight: isOpen ? `${categories.length * 44}px` : "0px" }}
                >
                  <div className="px-4 pb-4">
                    <div className="grid gap-3">
                      {categories.map((slug) => (
                        <Link
                          key={slug}
                          href={`/category/${slug}`}
                          className="text-sm text-gray-600 transition hover:text-gray-900"
                          onClick={onClose}
                        >
                          {slugToLabel(slug)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 space-y-3">
          <Link
            href="/account"
            className="block text-sm font-semibold text-gray-700"
            onClick={onClose}
          >
            Account
          </Link>
          <Link
            href="/cart"
            className="block text-sm font-semibold text-gray-700"
            onClick={onClose}
          >
            Cart
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { NavGroup } from "@/config/store-navigation";
import { STORE_NAVIGATION } from "@/config/store-navigation";

const slugToLabel = (slug: string) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

type MegaMenuProps = {
  label?: string;
};

export default function MegaMenu({ label = "Products" }: MegaMenuProps) {
  const [open, setOpen] = useState(false);
  const navigation = useMemo(() => STORE_NAVIGATION, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  const renderGroup = (group: NavGroup) => {
    return (
      <div key={group.title} className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          {group.title}
        </p>
        <div className="space-y-4">
          {group.groups?.map((child) => (
            <div key={child.title} className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">{child.title}</p>
              <div className="flex flex-col gap-2 text-sm text-gray-600">
                {child.categories?.map((slug) => (
                  <Link
                    key={slug}
                    href={`/category/${slug}`}
                    className="transition hover:text-gray-900"
                    role="menuitem"
                  >
                    {slugToLabel(slug)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {group.categories?.map((slug) => (
            <Link
              key={slug}
              href={`/category/${slug}`}
              className="text-sm text-gray-600 transition hover:text-gray-900"
              role="menuitem"
            >
              {slugToLabel(slug)}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onFocus={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#0b0b0b]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </button>

      {open && (
        <div
          className="absolute left-1/2 top-full z-50 mt-3 w-[min(960px,90vw)] -translate-x-1/2 rounded-xl border border-gray-100 bg-white p-6 shadow-lg"
          role="menu"
        >
          <div className="grid gap-8 md:grid-cols-3">
            {navigation.map((group) => renderGroup(group))}
          </div>
        </div>
      )}
    </div>
  );
}

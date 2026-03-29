"use client";

import type { NavigationItem } from "@/config/navigation";
import type { CategoryNode } from "@/lib/categories";
import MobileDrawerMenu from "./MobileDrawerMenu";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
  categories: CategoryNode[];
};

export default function MobileMenu({
  open,
  onClose,
  navigation,
  categories,
}: MobileMenuProps) {
  if (!open) return null;

  const visibleNavigation = navigation.filter(
    (item) => item.label !== "Ramadan Sale"
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
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
          X
        </button>
      </div>

      <div className="h-[calc(100vh-65px)] overflow-y-auto px-5 pb-10 pt-5">
        <MobileDrawerMenu
          navigation={visibleNavigation}
          categories={categories}
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}

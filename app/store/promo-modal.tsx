"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const STORAGE_KEY = "creality_promo_dismissed_v1";

export default function PromoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : "1";
    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative h-40 w-full">
          <Image
            src="/images/printers.jpg"
            alt="New release"
            fill
            sizes="(max-width: 768px) 90vw, 420px"
            className="object-cover"
            priority
          />
        </div>
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            New Release
          </p>
          <h2 className="mt-3 text-xl font-semibold text-gray-900">
            Meet the next-generation K1 lineup
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Faster printing, cleaner surfaces, and smarter controls.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Explore
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

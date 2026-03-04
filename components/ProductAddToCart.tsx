"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

type ProductAddToCartProps = {
  productId: number;
  disabled?: boolean;
};

export default function ProductAddToCart({
  productId,
  disabled = false,
}: ProductAddToCartProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);

  const handleAdd = async () => {
    try {
      setIsAdding(true);
      await addItem(productId, 1);
      setFeedback("success");
      setTimeout(() => setFeedback(null), 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setFeedback("error");
      setTimeout(() => setFeedback(null), 2000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled || isAdding}
        className="w-full rounded-2xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        aria-label="Add to cart"
      >
        {isAdding ? "Adding…" : "Add to cart"}
      </button>
      {feedback === "success" && (
        <p className="text-center text-xs font-medium text-green-600">✓ Added to cart</p>
      )}
      {feedback === "error" && (
        <p className="text-center text-xs font-medium text-red-500">Failed to add</p>
      )}
    </div>
  );
}

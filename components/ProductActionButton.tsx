"use client";

import { useEffect, useState } from "react";
import type { ProductOrderType } from "@/lib/woocommerce-types";

type ProductActionButtonProps = {
  product_order_type: ProductOrderType;
  productName: string;
  loading?: boolean;
  added?: boolean;
  onAddToCart?: () => void | Promise<void>;
  onSpecialOrder?: () => void;
};

const PRE_ORDER_BLOCK_MESSAGE =
  "This is a pre-order item. Click 'Pre-Order' in the dedicated section (homepage) to reserve it. Shipping is $0 and it ships in ~45 days.";

const BUTTON_STYLES: Record<ProductOrderType, string> = {
  in_stock:
    "bg-[#22C55E] hover:bg-[#16A34A]",
  special_order:
    "bg-[#F97316] hover:bg-[#EA580C]",
  pre_order:
    "bg-[#9333EA] hover:bg-[#7E22CE]",
};

const BUTTON_LABELS: Record<ProductOrderType, string> = {
  in_stock: "Add to Cart",
  special_order: "Special Order",
  pre_order: "Pre-Order",
};

const SHIPPING_MESSAGES: Record<ProductOrderType, string> = {
  in_stock: "In stock",
  special_order: "Ships in 1012 days  Shipping fee applies",
  pre_order: "Ships in ~45 days  $0 shipping",
};

export default function ProductActionButton({
  product_order_type,
  productName,
  loading = false,
  added = false,
  onAddToCart,
  onSpecialOrder,
}: ProductActionButtonProps) {
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (product_order_type !== "pre_order") {
      setBlockedMessage(null);
    }
  }, [product_order_type]);

  const handleClick = async () => {
    if (loading) {
      return;
    }

    if (product_order_type === "in_stock") {
      await onAddToCart?.();
      return;
    }

    if (product_order_type === "special_order") {
      onSpecialOrder?.();
      return;
    }

    setBlockedMessage(PRE_ORDER_BLOCK_MESSAGE);
  };

  const buttonLabel =
    product_order_type === "in_stock"
      ? loading
        ? "Adding..."
        : added
        ? "Added"
        : BUTTON_LABELS[product_order_type]
      : BUTTON_LABELS[product_order_type];

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        aria-label={`${BUTTON_LABELS[product_order_type]} for ${productName}`}
        className={`inline-flex min-h-10 w-full items-center justify-center rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition duration-150 ${BUTTON_STYLES[product_order_type]}`}
      >
        {buttonLabel}
      </button>

      <p className="text-[12px] text-[#6b7280]">
        {SHIPPING_MESSAGES[product_order_type]}
      </p>

      {blockedMessage && (
        <p className="text-[12px] text-[#9333EA]">{blockedMessage}</p>
      )}
    </div>
  );
}

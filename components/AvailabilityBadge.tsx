import clsx from "clsx";
import type { ProductAvailability } from "@/lib/productAvailability";

type AvailabilityBadgeProps = {
  availability: ProductAvailability;
  className?: string;
};

const COLOR_MAP = {
  available: "bg-green-500 text-white",
  special: "bg-orange-500 text-white",
  preorder: "bg-purple-500 text-white",
  unavailable: "bg-gray-400 text-white",
} as const;

export default function AvailabilityBadge({
  availability,
  className,
}: AvailabilityBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        COLOR_MAP[availability.type],
        className
      )}
    >
      {availability.badge}
    </span>
  );
}

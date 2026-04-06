import Image from "next/image";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/image";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

export default function ProductImage({
  src,
  alt,
  className,
}: ProductImageProps) {
  return (
    <Image
      src={src || FALLBACK_PRODUCT_IMAGE}
      alt={alt}
      width={600}
      height={600}
      className={["product-image", className].filter(Boolean).join(" ")}
      loading="lazy"
    />
  );
}

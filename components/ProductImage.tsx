/* eslint-disable @next/next/no-img-element */

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

const fallbackImage = "/images/product-placeholder.svg";

export default function ProductImage({
  src,
  alt,
  className,
}: ProductImageProps) {
  return (
    <img
      src={src || fallbackImage}
      alt={alt}
      className={["product-image", className].filter(Boolean).join(" ")}
      loading="lazy"
    />
  );
}

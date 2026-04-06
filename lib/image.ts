export const FALLBACK_PRODUCT_IMAGE = "/images/product-placeholder.svg";

type ImageCandidate = {
  thumbnail?: string | null;
  src?: string | null;
};

export function resolveImageSource(
  image?: ImageCandidate | null,
  fallback = FALLBACK_PRODUCT_IMAGE
) {
  return image?.thumbnail || image?.src || fallback;
}

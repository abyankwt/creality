type ProductTagLike =
  | string
  | {
      name?: string | null;
      slug?: string | null;
    };

type ProductLike = {
  stock_status?: string | null;
  tags?: ProductTagLike[] | null;
};

export type ProductAvailability = {
  type: "preorder" | "available" | "special";
  label: "Pre-Order" | "Add to Cart" | "Special Order";
  lead?: string;
};

function isPreorderTag(tag: ProductTagLike) {
  if (typeof tag === "string") {
    return tag.toLowerCase() === "preorder";
  }

  return [tag.name, tag.slug].some(
    (value) => value?.toLowerCase().includes("preorder") ?? false
  );
}

export function getProductAvailability(
  product: ProductLike | null | undefined
): ProductAvailability {
  const isPreorder = product?.tags?.some(isPreorderTag);

  if (isPreorder) {
    return {
      type: "preorder",
      label: "Pre-Order",
      lead: "Delivery: 30-45 days",
    };
  }

  if (product?.stock_status === "instock") {
    return {
      type: "available",
      label: "Add to Cart",
    };
  }

  return {
    type: "special",
    label: "Special Order",
    lead: "Delivery: 10-12 days",
  };
}

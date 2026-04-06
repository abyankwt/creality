import ProductCardSkeleton from "@/components/ProductCardSkeleton";

type ProductGridSkeletonProps = {
  count?: number;
};

export default function ProductGridSkeleton({
  count = 8,
}: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={`product-skeleton-${index}`} />
      ))}
    </div>
  );
}

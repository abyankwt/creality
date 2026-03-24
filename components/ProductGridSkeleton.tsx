type ProductGridSkeletonProps = {
  count?: number;
};

export default function ProductGridSkeleton({
  count = 8,
}: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`product-skeleton-${index}`}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-[10px]"
        >
          <div className="aspect-square rounded-xl bg-gray-100" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-3/4 rounded bg-gray-100" />
          </div>
          <div className="mt-4 h-5 w-1/3 rounded bg-gray-100" />
          <div className="mt-4 h-10 rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

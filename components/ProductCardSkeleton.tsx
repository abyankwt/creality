export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-[10px]">
      <div className="aspect-square rounded-xl bg-gray-100" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-3/4 rounded bg-gray-100" />
      </div>
      <div className="mt-4 h-5 w-1/3 rounded bg-gray-100" />
      <div className="mt-2 h-4 w-1/4 rounded bg-gray-100" />
      <div className="mt-4 h-10 rounded-lg bg-gray-100" />
    </div>
  );
}

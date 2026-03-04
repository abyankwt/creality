import Link from "next/link";
import Image from "next/image";
import type { CategoryNode } from "@/lib/categories";

type CategoryColumnProps = {
    category: CategoryNode;
    onNavigate?: () => void;
};

export default function CategoryColumn({ category, onNavigate }: CategoryColumnProps) {
    return (
        <div className="space-y-3">
            {/* Column header */}
            <Link
                href={`/category/${category.slug}`}
                className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400 transition hover:text-gray-700"
                onClick={onNavigate}
            >
                {category.name}
            </Link>

            {/* Optional category image */}
            {category.image && (
                <Link
                    href={`/category/${category.slug}`}
                    className="group relative block h-28 w-full overflow-hidden rounded-xl bg-gray-100"
                    onClick={onNavigate}
                >
                    <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="220px"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                </Link>
            )}

            {/* Child categories */}
            {category.children.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    {category.children.map((child) => (
                        <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                            role="menuitem"
                            onClick={onNavigate}
                        >
                            {child.name}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

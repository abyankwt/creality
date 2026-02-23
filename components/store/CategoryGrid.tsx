import Image from "next/image";
import Link from "next/link";

type CategoryItem = {
  title: string;
  slug: string;
  image: string;
};

const categories: CategoryItem[] = [
  { title: "3D Printers", slug: "3d-printers", image: "/images/printers.jpg" },
  { title: "Materials", slug: "materials", image: "/images/materials.jpg" },
  { title: "Spare Parts", slug: "spare-parts", image: "/images/spareparts.jpg" },
  { title: "3D Scanners", slug: "3d-scanners", image: "/images/printers.jpg" },
  { title: "Post Processing", slug: "post-processing", image: "/images/materials.jpg" },
  { title: "Accessories", slug: "accessories", image: "/images/spareparts.jpg" },
];

function CategoryCard({ title, slug, image }: CategoryItem) {
  return (
    <Link
      href={`/category/${slug}`}
      className="group relative flex h-36 items-end overflow-hidden rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
    >
      <Image
        src={image}
        alt={title}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition duration-200 ease-out group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-white/10" />
      <span className="relative z-10 text-sm font-semibold text-[#0b0b0b]">
        {title}
      </span>
    </Link>
  );
}

export default function CategoryGrid() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Categories
          </p>
          <h2 className="mt-3 text-[24px] font-semibold tracking-tight text-[#0b0b0b] sm:text-[32px]">
            Hardware built for every workflow.
          </h2>
        </div>
        <Link
          href="/store"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 transition hover:text-[#0b0b0b]"
        >
          View all
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard key={category.slug} {...category} />
        ))}
      </div>
    </section>
  );
}

import Link from "next/link";
import { Package, Printer, ScanLine, Wrench } from "lucide-react";

const CATEGORIES = [
  {
    title: "Printers",
    href: "/category/3d-printers",
    icon: Printer,
  },
  {
    title: "Filament",
    href: "/category/materials",
    icon: Package,
  },
  {
    title: "Spare Parts",
    href: "/category/spare-parts",
    icon: Wrench,
  },
  {
    title: "Scanners",
    href: "/category/3d-scanners",
    icon: ScanLine,
  },
] as const;

export default function CategoryNavigation() {
  return (
    <section className="bg-[#f8f8f8] py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-5 text-center sm:text-left">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Shop by Category
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Jump straight to the product groups customers browse most.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map(({ title, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="category-card flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-5 text-center transition hover:border-gray-300 hover:shadow-sm"
            >
              <span className="mb-3 inline-flex rounded-full bg-gray-100 p-3 text-gray-800">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-gray-900">{title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-14 lg:pt-12">
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Creality Store
          </p>
          <h1 className="mt-4 text-[32px] font-semibold leading-[1.05] tracking-tight text-[#0b0b0b] sm:text-[40px] lg:text-[48px]">
            Precision 3D hardware for serious makers.
          </h1>
          <p className="mt-4 max-w-xl text-[16px] text-gray-600">
            Printers, materials, and parts engineered for consistent output.
          </p>
          <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/category/3d-printers"
              className="inline-flex w-full items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#111111] active:scale-[0.98] sm:w-auto"
            >
              Shop printers
            </Link>
            <Link
              href="/printing-service"
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-[#0b0b0b] transition duration-200 hover:border-[#0b0b0b] active:scale-[0.98] sm:w-auto"
            >
              Printing services
            </Link>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white shadow-[0_18px_45px_rgba(17,24,39,0.12)]">
            <Image
              src="/images/printers.jpg"
              alt="Creality 3D printer"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

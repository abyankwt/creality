"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CampaignSlide } from "@/config/campaigns";
import SmartImage from "@/components/SmartImage";

type CampaignHeroProps = {
  slides: CampaignSlide[];
};

export default function CampaignHero({ slides }: CampaignHeroProps) {
  const active = slides.filter((slide) => slide.isActive);
  const [current, setCurrent] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
  });

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  const next = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const prev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const onSelect = () => {
      setCurrent(emblaApi.selectedScrollSnap());
    };

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    setCurrent(0);
    emblaApi?.scrollTo(0, true);
  }, [emblaApi, active.length]);

  useEffect(() => {
    if (!emblaApi || active.length <= 1) {
      return;
    }

    const id = window.setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => window.clearInterval(id);
  }, [active.length, emblaApi]);

  if (active.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
      <div className="group relative w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-sm">
        <div className="embla overflow-hidden rounded-2xl" ref={emblaRef}>
          <div className="embla__container flex">
            {active.map((slide, index) => {
              const overlay = Math.min(slide.overlayOpacity ?? 0.05, 0.1);
              const isLight = slide.textColor === "light";

              return (
                <div
                  key={`${slide.title}-${index}`}
                  className="embla__slide min-w-0 flex-[0_0_100%]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden md:aspect-[16/7]">
                    <div className="absolute inset-0">
                      <SmartImage
                        src={slide.backgroundImage}
                        alt={slide.title}
                        mode="banner"
                        priority={index === 0}
                        sizes="100vw"
                        className="h-full rounded-none"
                        imageClassName="transition-transform duration-500 ease-out"
                      />
                    </div>

                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
                    />

                    <div className="relative z-20 flex h-full flex-col justify-end px-5 pb-10 sm:px-8 sm:pb-12 md:px-12 md:pb-14 lg:px-16">
                      <div className="flex flex-row flex-wrap items-center gap-3 md:gap-4">
                        <Link
                          href={slide.primaryCTA.link}
                          className="inline-flex items-center justify-center rounded-full bg-[#0ed145] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0cb73b] md:text-base"
                        >
                          {slide.primaryCTA.text}
                        </Link>

                        {slide.secondaryCTA && (
                          <Link
                            href={slide.secondaryCTA.link}
                            className={`inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-medium transition-colors md:text-base ${
                              isLight
                                ? "border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                                : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                            }`}
                          >
                            {slide.secondaryCTA.text}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {active.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-white/70 p-1.5 text-gray-700 shadow-sm backdrop-blur transition-opacity hover:bg-white md:block md:opacity-0 md:group-hover:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-white/70 p-1.5 text-gray-700 shadow-sm backdrop-blur transition-opacity hover:bg-white md:block md:opacity-0 md:group-hover:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {active.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
            {active.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollTo(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === current
                    ? "w-5 bg-gray-900"
                    : "w-1.5 bg-gray-900/25 hover:bg-gray-900/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

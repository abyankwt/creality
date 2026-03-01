"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FLYERS, Flyer } from "@/config/flyers";

export default function InteractiveFlyer({ flyers: customFlyers }: { flyers?: Flyer[] } = {}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const baseFlyers = customFlyers && customFlyers.length > 0 ? customFlyers : FLYERS;
    const activeFlyers = baseFlyers.filter((f) => f.isActive);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % activeFlyers.length);
    }, [activeFlyers.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + activeFlyers.length) % activeFlyers.length);
    }, [activeFlyers.length]);

    useEffect(() => {
        if (activeFlyers.length <= 1) return;
        const timer = setInterval(nextSlide, 7000);
        return () => clearInterval(timer);
    }, [activeFlyers.length, nextSlide]);

    if (activeFlyers.length === 0) return null;

    return (
        <div className="group relative w-full overflow-hidden bg-[#f4f7f9] md:bg-[#050505] min-h-[85svh] md:min-h-[500px] md:h-[65vh] md:max-h-[700px] flex flex-col justify-end">
            {/* Slides */}
            <div className="absolute inset-0 w-full h-full">
                {activeFlyers.map((flyer, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 flex flex-col md:block transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                            }`}
                    >
                        {/* Interactive Slide Link Wrapper */}
                        <Link href={flyer.ctaLink} className="absolute inset-0 z-20" aria-label={`View ${flyer.title}`} />

                        {/* Atmospheric Blurred Background Layer for mobile to blend sharp banner edges */}
                        <div className="md:hidden absolute inset-0 -z-10 bg-transparent overflow-hidden">
                            <Image
                                src={flyer.image}
                                alt="Background"
                                fill
                                priority={index === 0}
                                className="object-cover scale-110 blur-3xl opacity-40 mix-blend-multiply"
                                sizes="100vw"
                            />
                        </div>

                        {/* Content Layer (Flows at top on mobile, positioned absolute on desktop) */}
                        <div className="relative z-30 flex flex-col items-center justify-start pt-14 px-6 text-center pointer-events-none md:absolute md:inset-0 md:pt-24 md:px-16 pb-4">
                            <div className="flex flex-col items-center justify-center pointer-events-auto max-w-2xl mx-auto md:drop-shadow-none">
                                <span className="text-[#0ed145] font-semibold text-sm md:text-base tracking-wider mb-1 md:mb-2 drop-shadow-sm md:drop-shadow-none">
                                    New
                                </span>

                                {/* Headline */}
                                <h2 className="text-4xl sm:text-5xl lg:text-[4rem] font-bold tracking-tight text-[#050505] mb-2 md:mb-3 leading-[1.1] drop-shadow-sm md:drop-shadow-none">
                                    {flyer.title}
                                </h2>

                                {/* Subheadline */}
                                <p className="text-sm sm:text-lg md:text-[22px] text-[#222] md:text-black mb-6 md:mb-8 font-medium drop-shadow-sm md:drop-shadow-none">
                                    {flyer.subtitle}
                                </p>

                                {/* CTAs */}
                                <div className="flex flex-row items-center justify-center gap-3 md:gap-4 w-full sm:w-auto">
                                    <Link
                                        href={flyer.ctaLink}
                                        className="w-full sm:w-auto min-w-[140px] md:min-w-[160px] inline-flex items-center justify-center rounded-full bg-[#0ed145] px-6 md:px-8 py-3 text-sm md:text-base font-semibold text-white transition-all hover:bg-[#0ca735] hover:scale-[1.02] shadow-sm"
                                    >
                                        {flyer.ctaText}
                                    </Link>
                                    {flyer.secondaryCtaText && flyer.secondaryCtaLink && (
                                        <Link
                                            href={flyer.secondaryCtaLink}
                                            className="w-full sm:w-auto min-w-[140px] md:min-w-[160px] inline-flex items-center justify-center rounded-full bg-white px-6 md:px-8 py-3 text-sm md:text-base font-semibold text-[#0ed145] border md:border-none border-[#0ed145]/20 transition-all hover:bg-gray-50 hover:scale-[1.02] shadow-sm"
                                        >
                                            {flyer.secondaryCtaText}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Image Layer (Takes remaining space on mobile, absolute full-cover on desktop) */}
                        <div className="relative flex-1 w-full md:absolute md:inset-0 md:bg-transparent -z-10 flex items-end justify-center">
                            <Image
                                src={flyer.image}
                                alt={flyer.title}
                                fill
                                priority={index === 0}
                                className="object-cover object-[85%_bottom] md:object-center drop-shadow-2xl md:drop-shadow-none"
                                sizes="100vw"
                            />
                        </div>

                        {/* Product Lineup Layer (Desktop mostly, small on mobile) */}
                        {flyer.products && flyer.products.length > 0 && (
                            <div className="absolute bottom-8 right-6 md:right-16 hidden md:flex items-end gap-2 md:gap-4 z-20 filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]">
                                {flyer.products.map((prodImg, i) => (
                                    <div key={i} className="relative w-20 h-24 md:w-32 md:h-40 filter mix-blend-luminosity brightness-110 contrast-125">
                                        <Image
                                            src={prodImg}
                                            alt="Product display"
                                            fill
                                            className="object-contain hover:-translate-y-2 transition-transform duration-500 rounded-lg drop-shadow-xl"
                                        />
                                        <div className="absolute -bottom-6 left-0 w-full h-6 bg-gradient-to-b from-white/10 to-transparent blur-[2px] rotate-180 opacity-20" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Manual Controls */}
            {activeFlyers.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={prevSlide}
                        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-40 p-2 text-white/40 hover:text-white bg-black/10 hover:bg-black/40 backdrop-blur-md rounded-full transition-all md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                    </button>
                    <button
                        type="button"
                        onClick={nextSlide}
                        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-40 p-2 text-white/40 hover:text-white bg-black/10 hover:bg-black/40 backdrop-blur-md rounded-full transition-all md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                    </button>

                    {/* Minimal Carousel Indicators */}
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex gap-2">
                        {activeFlyers.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setCurrentIndex(index)}
                                className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

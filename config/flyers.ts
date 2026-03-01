export type FlyerBadge = {
    text: string;
    subText?: string;
    position: "left" | "right";
};

export type Flyer = {
    title: string;
    subtitle: string;
    image: string;
    ctaText: string;
    ctaLink: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    badge?: FlyerBadge;
    products?: string[];
    isActive: boolean;
};

export const FLYERS: Flyer[] = [
    {
        title: "SPARKX i7",
        subtitle: "Make Every Spark Outplay",
        image: "/images/printers.jpg",
        ctaText: "Explore Now",
        ctaLink: "/category/3d-printers",
        secondaryCtaText: "Pre-order Now",
        secondaryCtaLink: "/category/3d-printers",
        isActive: true,
    },
    {
        title: "K2 Series",
        subtitle: "The Ultimate Creative Powerhouses",
        image: "/images/materials.jpg",
        ctaText: "Learn More",
        ctaLink: "/category/3d-printers",
        secondaryCtaText: "Buy Now",
        secondaryCtaLink: "/category/3d-printers",
        isActive: true,
    }
];

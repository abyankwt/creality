export type SocialLink = {
    platform: string;
    url: string;
};

export type SocialConfig = {
    official: SocialLink[];
    local: SocialLink[];
};

export const SOCIAL_LINKS: SocialConfig = {
    official: [
        { platform: "TikTok", url: "https://tiktok.com/@crealityofficial" },
        { platform: "YouTube", url: "https://youtube.com/c/Creality3D" },
        { platform: "Instagram", url: "https://instagram.com/crealityofficial" },
        { platform: "Facebook", url: "https://facebook.com/Creality3D" },
        { platform: "X", url: "https://x.com/creality3d" },
        { platform: "Discord", url: "https://discord.gg/creality" },
    ],
    local: [
        { platform: "TikTok", url: "https://tiktok.com/@crealitykuwait" },
        { platform: "YouTube", url: "https://youtube.com/@crealitykuwait" },
        { platform: "Instagram", url: "https://instagram.com/crealitykuwait" },
        { platform: "Facebook", url: "https://facebook.com/crealitykuwait" },
        { platform: "X", url: "https://x.com/crealitykuwait" },
        { platform: "Discord", url: "https://discord.gg/crealitykuwait" },
    ],
};

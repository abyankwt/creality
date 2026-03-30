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
        { platform: "TikTok", url: "https://www.tiktok.com/@creality.kw?_r=1&_t=ZS-955cGDLCI9x" },
        { platform: "YouTube", url: "https://www.youtube.com/@Creality3D" },
        { platform: "Instagram", url: "https://www.instagram.com/creality.kw/" },
        { platform: "Facebook", url: "https://www.facebook.com/share/18Jr5Wbqkq/?mibextid=wwXIfr" },
        { platform: "X", url: "https://x.com/Creality3dP" },
        {
            platform: "WhatsApp",
            url: "https://wa.me/96522092260?text=Hello%2C%20I%20need%20assistance%20with%20your%20products.",
        },
    ],
    local: [
        { platform: "TikTok", url: "https://www.tiktok.com/@creality.kw?_r=1&_t=ZS-955cGDLCI9x" },
        { platform: "YouTube", url: "https://www.youtube.com/@Creality3D" },
        { platform: "Instagram", url: "https://www.instagram.com/creality.kw/" },
        { platform: "Facebook", url: "https://www.facebook.com/share/18Jr5Wbqkq/?mibextid=wwXIfr" },
        { platform: "X", url: "https://x.com/Creality3dP" },
        {
            platform: "WhatsApp",
            url: "https://wa.me/96522092260?text=Hello%2C%20I%20need%20assistance%20with%20your%20products.",
        },
    ],
};

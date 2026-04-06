import "server-only";

import type { CrealityPopupData } from "@/types/creality-cms";

function getWordPressBaseUrl() {
  return (
    process.env.WORDPRESS_URL?.trim() ||
    process.env.NEXT_PUBLIC_WC_BASE_URL?.trim() ||
    process.env.WC_BASE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
}

export async function fetchHomepagePopup(): Promise<CrealityPopupData | null> {
  const baseUrl = getWordPressBaseUrl();

  if (!baseUrl) {
    return null;
  }

  try {
    const res = await fetch(`${baseUrl}/wp-json/creality/v1/popup`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as CrealityPopupData | null;

    console.log("API RAW:", data);

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch homepage popup settings:", error);
    return null;
  }
}

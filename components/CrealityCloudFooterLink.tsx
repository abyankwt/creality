"use client";

import Image from "next/image";

const CREALITY_CLOUD_URL = "https://www.crealitycloud.com/";

export default function CrealityCloudFooterLink() {
  return (
    <a
      href={CREALITY_CLOUD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 transition hover:opacity-80"
      aria-label="Open Creality Cloud in a new tab"
    >
      <Image
        src="/cube-logo.png"
        alt="Creality Cloud"
        width={24}
        height={24}
        className="h-6 w-6 object-contain"
        style={{ height: "auto" }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">Creality Cloud</span>
        <span className="text-xs text-gray-500">
          Discover 3D models & prints
        </span>
      </div>
    </a>
  );
}

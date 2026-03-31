"use client";

import Image from "next/image";

const CREALITY_CLOUD_URL = "https://www.crealitycloud.com/";

export default function CrealityCloudCard() {
  return (
    <a
      href={CREALITY_CLOUD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
      aria-label="Open Creality Cloud in a new tab"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
        <Image
          src="/cube-logo.png"
          alt="Creality Cloud"
          width={20}
          height={20}
          className="h-5 w-5 object-contain"
          style={{ height: "auto" }}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-900">Creality Cloud</span>
        <span className="text-xs text-gray-500">
          Discover 3D models & prints
        </span>
      </div>
    </a>
  );
}

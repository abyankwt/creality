"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadCloud, Search, Download, Heart, Box } from "lucide-react";
import UploadModelModal from "./UploadModelModal";

type Model = {
    id: string;
    title: string;
    author: string;
    price: string;
    downloads: number;
    likes: number;
    image: string;
    category: string;
};

const MOCK_MODELS: Model[] = [
    {
        id: "m1",
        title: "Industrial Enclosure Case v2",
        author: "Creality Team",
        price: "Free",
        downloads: 1240,
        likes: 342,
        image: "/placeholder.png",
        category: "Functional",
    },
    {
        id: "m2",
        title: "High-Flow Turbo Fan Duct",
        author: "MakerPro",
        price: "1.50 KWD",
        downloads: 87,
        likes: 12,
        image: "/placeholder.png",
        category: "Upgrades",
    },
    {
        id: "m3",
        title: "Articulated Robotics Arm",
        author: "EduTech",
        price: "Free",
        downloads: 4320,
        likes: 1105,
        image: "/placeholder.png",
        category: "Robotics",
    }
];

export default function ModelRepository() {
    const [search, setSearch] = useState("");
    const [isUploadOpen, setUploadOpen] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search 3D models..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-black focus:outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setUploadOpen(true)}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                    <UploadCloud className="h-4 w-4" />
                    Upload Model
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {MOCK_MODELS.filter((m) => m.title.toLowerCase().includes(search.toLowerCase())).map((model) => (
                    <div key={model.id} className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-all">
                        <div className="relative aspect-square w-full bg-gray-100">
                            <Image
                                src={model.image}
                                alt={model.title}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-gray-900 shadow-sm">
                                {model.price}
                            </div>
                        </div>

                        <div className="p-4 flex flex-1 flex-col">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-[#6BBE45] mb-1">
                                {model.category}
                            </p>
                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                                {model.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">by {model.author}</p>

                            <div className="mt-auto pt-4 flex items-center justify-between text-gray-400">
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                    <Download className="h-3.5 w-3.5" />
                                    {model.downloads}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                    <Heart className="h-3.5 w-3.5" />
                                    {model.likes}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isUploadOpen && (
                <UploadModelModal onClose={() => setUploadOpen(false)} />
            )}
        </div>
    );
}

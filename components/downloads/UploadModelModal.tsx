"use client";

import { useState } from "react";
import { X, UploadCloud, FileType, CheckCircle2 } from "lucide-react";

type UploadModelModalProps = {
    onClose: () => void;
};

export default function UploadModelModal({ onClose }: UploadModelModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [isUploading, setIsUploading] = useState(false);

    const handleSimulateUpload = (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        setTimeout(() => {
            setIsUploading(false);
            setStep(2);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>

                {step === 1 ? (
                    <>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Upload 3D Model</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Share your files with the community. Storage is powered by S3-compatible backend.
                        </p>

                        <form onSubmit={handleSimulateUpload} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Model Name</label>
                                <input required type="text" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none" placeholder="e.g. Articulated Dragon" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                                <textarea required rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none" placeholder="Printing details, parameters, etc." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                                    <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none">
                                        <option>Functional</option>
                                        <option>Art & Decor</option>
                                        <option>Upgrades</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Price (KWD)</label>
                                    <input type="number" min="0" step="0.5" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none" placeholder="0 = Free" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">STL / OBJ File</label>
                                <div className="flex justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 hover:border-gray-400 transition cursor-pointer">
                                    <div className="text-center">
                                        <FileType className="mx-auto h-8 w-8 text-gray-400" />
                                        <div className="mt-2 text-sm text-gray-600">
                                            <span className="font-semibold text-black">Click to upload</span> or drag and drop
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">Max file size 50MB (S3 stubbed)</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isUploading}
                                className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-70"
                            >
                                {isUploading ? "Uploading to Cloud..." : "Publish Model"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <CheckCircle2 className="mx-auto h-16 w-16 text-[#6BBE45] mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Model Published!</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Your 3D model has been successfully uploaded to the repository and is now live.
                        </p>
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

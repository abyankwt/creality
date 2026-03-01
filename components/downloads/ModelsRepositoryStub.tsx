"use client";

import { UploadCloud, Box } from "lucide-react";

export default function ModelsRepositoryStub() {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20 animate-in fade-in duration-500">
            <div className="mb-6 rounded-2xl bg-gray-50 p-6 shadow-sm border border-gray-100">
                <Box className="h-12 w-12 text-gray-400 mx-auto" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">3D Model Repository</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md">
                Upload, share, and download production-ready 3D models. Full repository with authentication and payment integration is rolling out in Sprint 4.
            </p>

            <div className="mt-8">
                <button
                    disabled
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-6 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed"
                >
                    <UploadCloud className="h-4 w-4" />
                    Upload Model (Coming Soon)
                </button>
            </div>
        </div>
    );
}

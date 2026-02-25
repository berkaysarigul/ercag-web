'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-6xl font-bold text-red-500 mb-4">!</h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bir Hata Oluştu</h2>
            <p className="text-gray-600 mb-8 max-w-md">
                Beklenmedik bir hata meydana geldi. Lütfen tekrar deneyin.
            </p>
            <button
                onClick={() => reset()}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-lg inline-flex items-center justify-center"
            >
                Tekrar Dene
            </button>
        </div>
    );
}

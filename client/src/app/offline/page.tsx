'use client';

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center text-center p-8 bg-gray-50">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="mb-6 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                        <line x1="12" y1="20" x2="12.01" y2="20"></line>
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Çevrimdışısınız</h1>
                <p className="text-gray-600 mb-8">İnternet bağlantınız yok gibi görünüyor. Lütfen bağlantınızı kontrol edip tekrar deneyin.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 px-4 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm"
                >
                    Tekrar Dene
                </button>
            </div>
        </div >
    );
}

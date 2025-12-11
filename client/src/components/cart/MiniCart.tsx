'use client';

import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MiniCartProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
    const { items, removeFromCart, total } = useCart();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-[400px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="p-4 border-b flex justify-between items-center bg-[var(--surface)]">
                    <h2 className="text-xl font-bold text-[var(--primary)]">Sepetim ({items.length})</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>Sepetiniz boş.</p>
                            <button onClick={onClose} className="mt-4 text-[var(--primary)] underline">Alışverişe Devam Et</button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4 border-b pb-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border">
                                    {item.image ? (
                                        <img
                                            src={`http://localhost:3001/uploads/${item.image}`}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs text-gray-400">Görsel Yok</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm text-gray-600">{item.quantity} x {item.price.toFixed(2)} ₺</span>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-4 border-t bg-gray-50 space-y-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Toplam</span>
                            <span className="text-[var(--primary)]">{total.toFixed(2)} ₺</span>
                        </div>
                        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 text-center">
                            ⚠️ Ödeme mağazada yapılacaktır
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Link
                                href="/cart"
                                onClick={onClose}
                                className="btn btn-outline text-center py-2"
                            >
                                Sepete Git
                            </Link>
                            <Link
                                href="/cart" // In future this could go directly to checkout modal
                                onClick={onClose}
                                className="btn btn-primary text-center py-2"
                            >
                                Sipariş Ver
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

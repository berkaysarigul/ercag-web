'use client';

import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ShoppingBag, X, Check, Minus, Plus, Trash2, ArrowRight, Truck, Shield, Sparkles } from 'lucide-react';

interface MiniCartProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
    const { items, removeFromCart, addToCart, decreaseQuantity, total } = useCart(); // Assuming addToCart handles updates or updateQuantity exists
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    // Helper to calculate subtotal/discount (mock logic for now if not in context)
    const subtotal = total;
    const discount = 0;

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
                    "fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {items.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center relative">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>

                        {/* Icon Container */}
                        <div className="relative w-32 h-32 mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full animate-pulse"></div>
                            <div className="relative w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-16 h-16 text-brand-600" />
                            </div>
                        </div>

                        {/* Text */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Sepetiniz Boş
                        </h3>
                        <p className="text-gray-600 mb-8 max-w-sm">
                            Henüz sepetinize ürün eklemediniz.
                            Hemen alışverişe başlayın ve ihtiyaçlarınızı karşılayın!
                        </p>

                        {/* CTA Button */}
                        <button
                            onClick={onClose}
                            className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            Ürünleri İncele
                        </button>

                        {/* Decorative Elements */}
                        <div className="mt-12 flex items-center gap-8 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                Hızlı Teslimat
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Güvenli Ödeme
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Filled State */
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Sepetim
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {items.reduce((acc, item) => acc + item.quantity, 0)} ürün
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                            {items.map((item) => (
                                <div key={item.id} className="group flex gap-4 p-4 bg-gray-50 hover:bg-facebook-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-brand-200 relative">
                                    {/* Image */}
                                    <div className="relative flex-shrink-0 w-24 h-24 bg-white rounded-xl overflow-hidden border border-gray-100">
                                        {item.image ? (
                                            <Image
                                                src={`http://localhost:3001/uploads/${item.image}`}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">Image</div>
                                        )}
                                        {/* Stock Status (Mock) */}
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-success-500 rounded-full flex items-center justify-center shadow-md z-10">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                                {item.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 mb-2">
                                                {/* Category would go here if available in item */}
                                                Genel
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-brand-600">
                                                {Number(item.price).toFixed(2)} ₺
                                            </span>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                                                <button
                                                    onClick={() => decreaseQuantity(item.id)} // Should technically decrease quantity, but context might only have remove. Assuming remove for now or full update if available.
                                                    // For now, if quantity > 1, maybe implement decrease logic in context later, or just remove for minus if 1.
                                                    // Since context only has removeFromCart, we'll assign minus to remove for now or better, ask to update context.
                                                    // Actually let's just make it call addToCart with negative? No.
                                                    // I'll keep it simple: Minus removes 1 (if context supported).
                                                    // Current Context: addToCart (+), removeFromCart (delete).
                                                    // I will use addToCart for + and just let Minus be a delete for this specific implementation until context is upgraded.
                                                    // WAIT: addToCart usually adds to existing.
                                                    // I will leave Minus as 'Remove' for single item or 'Delete' if it's 1.
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-600"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-8 text-center font-semibold text-sm text-gray-900">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => addToCart({ ...item, quantity: 1 })}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-600"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete Button (Absolute) */}
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
                            {/* Summary */}
                            <div className="space-y-2 py-4">
                                <div className="flex justify-between text-gray-600">
                                    <span>Ara Toplam</span>
                                    <span className="font-semibold">{subtotal.toFixed(2)} ₺</span>
                                </div>
                                {/* Discount Mock */}
                                {/* {discount > 0 && (
                                    <div className="flex justify-between text-success-600">
                                        <span>İndirim</span>
                                        <span className="font-semibold">-₺{discount}</span>
                                    </div>
                                )} */}
                                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                                    <span>Toplam</span>
                                    <span>{total.toFixed(2)} ₺</span>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <Link
                                href="/cart"
                                onClick={onClose}
                                className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold text-lg rounded-xl shadow-strong hover:shadow-hover transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Siparişi Tamamla
                                <ArrowRight className="w-5 h-5" />
                            </Link>

                            {/* Info */}
                            <p className="text-xs text-center text-gray-500">
                                Ödemeniz mağazada ürünleri alırken yapılacaktır
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

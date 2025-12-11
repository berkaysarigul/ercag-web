'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string | null;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any) => void;
    removeFromCart: (id: number) => void;
    clearCart: () => void;
    total: number;
    loaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setItems(JSON.parse(savedCart));
        }
        setLoaded(true);
    }, []);

    // Save cart to local storage on change
    useEffect(() => {
        if (loaded) {
            localStorage.setItem('cart', JSON.stringify(items));
        }
    }, [items, loaded]);

    const addToCart = (product: any) => {
        const existing = items.find((item) => item.id === product.id);

        if (existing) {
            toast.success('Ürün adedi güncellendi');
            setItems((prev) =>
                prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            );
        } else {
            toast.success('Ürün sepete eklendi');
            setItems((prev) => [...prev, {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: 1,
                image: product.image
            }]);
        }
    };

    const removeFromCart = (id: number) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.error('Ürün sepetten çıkarıldı');
    };

    const clearCart = () => {
        setItems([]);
    };

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, loaded }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

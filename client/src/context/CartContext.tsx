'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string | null;
    variantId?: number | null;
    variantLabel?: string | null;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: {
        id: number; name: string; price: number; image?: string | null;
        quantity?: number; category?: any;
        variantId?: number | null; variantLabel?: string | null;
    }) => void;
    updateQuantity: (id: number, quantity: number, variantId?: number | null) => void;
    decreaseQuantity: (id: number, variantId?: number | null) => void;
    removeFromCart: (id: number, variantId?: number | null) => void;
    clearCart: () => Promise<void>;
    total: number;
    discountAmount: number;
    finalAmount: number;
    appliedCampaigns: { id: number; name: string; discount: number }[];
    loaded: boolean;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [finalAmount, setFinalAmount] = useState(0);
    const [appliedCampaigns, setAppliedCampaigns] = useState<{ id: number; name: string; discount: number }[]>([]);
    const { user, loading: authLoading, logout } = useAuth();

    // Load cart from local storage on mount (Guest)
    // Or from API (User)
    useEffect(() => {
        if (authLoading) return;

        const loadCart = async () => {
            if (user) {
                // Logged in: Fetch from API
                try {
                    // Check if we have local items to sync first
                    const savedCart = localStorage.getItem('cart');
                    if (savedCart) {
                        const localItems = JSON.parse(savedCart);
                        if (localItems.length > 0) {
                            // Sync
                            const res = await api.post('/cart/sync', { items: localItems });
                            localStorage.removeItem('cart'); // Clear after sync

                            // Map backend response to frontend format
                            // Backend: items: [{ productId: 1, quantity: 2, product: { ... } }]
                            // Frontend: [{ id: 1, name: ..., price: ..., quantity: 2, image: ... }]
                            const mappedItems = res.data.items.map((item: { productId: number; product: { name: string; price: number; image?: string | null }; quantity: number }) => ({
                                id: item.productId,
                                name: item.product.name,
                                price: Number(item.product.price),
                                quantity: item.quantity,
                                image: item.product.image
                            }));
                            setItems(mappedItems);
                            setLoaded(true);
                            return;
                        }
                    }

                    // Just fetch if no sync needed
                    const res = await api.get('/cart');
                    const mappedItems = res.data.items ? res.data.items.map((item: { productId: number; product: { name: string; price: number; image?: string | null }; quantity: number }) => ({
                        id: item.productId,
                        name: item.product.name,
                        price: Number(item.product.price),
                        quantity: item.quantity,
                        image: item.product.image
                    })) : [];
                    setItems(mappedItems);
                    setDiscountAmount(Number(res.data.discountAmount) || 0);
                    setFinalAmount(Number(res.data.finalAmount) || 0);
                    setAppliedCampaigns(res.data.appliedCampaigns || []);

                } catch (error: unknown) {
                    console.error("Failed to fetch cart", error);
                    const errResponse = (error as any)?.response;
                    if (errResponse && (errResponse.status === 403 || errResponse.status === 401)) {
                        // Invalid token or user not found, logout
                        logout();
                    }
                }
            } else {
                // Guest: Load from Local Storage
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    setItems(JSON.parse(savedCart));
                }
            }
            setLoaded(true);
        };

        loadCart();
    }, [user, authLoading]);

    // Save cart to local storage on change (ONLY GUEST)
    useEffect(() => {
        if (loaded && !user) {
            localStorage.setItem('cart', JSON.stringify(items));
        }
    }, [items, loaded, user]);

    const addToCart = async (product: {
        id: number; name: string; price: number; image?: string | null;
        quantity?: number; category?: any;
        variantId?: number | null; variantLabel?: string | null;
    }) => {
        const quantityToAdd = product.quantity || 1;

        // Unique key: productId + variantId
        const matchKey = (item: CartItem) =>
            item.id === product.id && (item.variantId || null) === (product.variantId || null);

        const existing = items.find(matchKey);

        let newItems: CartItem[];
        if (existing) {
            newItems = items.map((item) =>
                matchKey(item) ? { ...item, quantity: item.quantity + quantityToAdd, price: Number(product.price) } : item
            );
        } else {
            newItems = [...items, {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: quantityToAdd,
                image: product.image,
                variantId: product.variantId || null,
                variantLabel: product.variantLabel || null,
            }];
        }
        setItems(newItems);
        toast.success(existing ? 'Ürün adedi güncellendi' : 'Ürün sepete eklendi');

        if (user) {
            try {
                await api.post('/cart/add', {
                    productId: product.id,
                    quantity: quantityToAdd,
                    variantId: product.variantId || null,
                });
            } catch (error) {
                console.error("Failed to add to cart API", error);
                toast.error('Sepete eklenirken hata oluştu');
            }
        }
    };

    const updateQuantity = async (id: number, quantity: number, variantId?: number | null) => {
        if (quantity < 1) {
            removeFromCart(id, variantId);
            return;
        }

        const matchKey = (item: CartItem) =>
            item.id === id && (item.variantId || null) === (variantId || null);

        setItems((prev) => prev.map((item) =>
            matchKey(item) ? { ...item, quantity } : item
        ));

        if (user) {
            try {
                await api.put('/cart/update', { productId: id, quantity, variantId: variantId || null });
            } catch (error) {
                console.error("Failed to update quantity", error);
                toast.error('Adet güncellenemedi');
            }
        }
    };

    const decreaseQuantity = async (id: number, variantId?: number | null) => {
        const existing = items.find((item) =>
            item.id === id && (item.variantId || null) === (variantId || null)
        );
        if (!existing) return;
        updateQuantity(id, existing.quantity - 1, variantId);
    };

    const removeFromCart = async (id: number, variantId?: number | null) => {
        setItems((prev) => prev.filter((item) =>
            !(item.id === id && (item.variantId || null) === (variantId || null))
        ));
        toast.error('Ürün sepetten çıkarıldı');

        if (user) {
            try {
                await api.delete(`/cart/remove/${id}${variantId ? `?variantId=${variantId}` : ''}`);
            } catch (error) {
                console.error("Failed to remove from cart API", error);
            }
        }
    };

    const clearCart = async () => {
        setItems([]);
        if (!user) {
            localStorage.removeItem('cart');
        } else {
            try {
                await api.delete('/cart/clear');
                toast.success('Sepetiniz temizlendi');
            } catch (error) {
                console.error("Failed to clear cart API", error);
            }
        }
    };

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const refreshCart = async () => {
        if (!user) return;
        try {
            const res = await api.get('/cart');
            const mapped = res.data.items ? res.data.items.map((item: { productId: number; product: { name: string; price: number; image?: string | null }; quantity: number }) => ({
                id: item.productId,
                name: item.product.name,
                price: Number(item.product.price),
                quantity: item.quantity,
                image: item.product.image
            })) : [];
            setItems(mapped);
            setDiscountAmount(Number(res.data.discountAmount) || 0);
            setFinalAmount(Number(res.data.finalAmount) || 0);
            setAppliedCampaigns(res.data.appliedCampaigns || []);
        } catch { }
    };

    return (
        <CartContext.Provider value={{ items, addToCart, updateQuantity, decreaseQuantity, removeFromCart, clearCart, total, discountAmount, finalAmount, appliedCampaigns, loaded, refreshCart }}>
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

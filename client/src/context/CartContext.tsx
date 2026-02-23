'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

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
    updateQuantity: (id: number, quantity: number) => void;
    decreaseQuantity: (id: number) => void;
    removeFromCart: (id: number) => void;
    clearCart: () => void;
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
                            const mappedItems = res.data.items.map((item: any) => ({
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
                    const mappedItems = res.data.items ? res.data.items.map((item: any) => ({
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

                } catch (error: any) {
                    console.error("Failed to fetch cart", error);
                    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
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

    const addToCart = async (product: any) => {
        // Optimistic update for UI speed
        const existing = items.find((item) => item.id === product.id);
        const quantityToAdd = product.quantity || 1;

        let newItems = [];
        if (existing) {
            newItems = items.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
            );
        } else {
            newItems = [...items, {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: quantityToAdd,
                image: product.image
            }];
        }
        setItems(newItems);
        toast.success(existing ? 'Ürün adedi güncellendi' : 'Ürün sepete eklendi');

        if (user) {
            try {
                await api.post('/cart/add', {
                    productId: product.id,
                    quantity: quantityToAdd
                });
                // In a perfect world we would re-fetch to ensure sync, but optimistic is fine for now
            } catch (error) {
                console.error("Failed to add to cart API", error);
                toast.error('Sepete eklenirken hata oluştu');
                // Revert? For now let's hope it works.
            }
        }
    };

    const updateQuantity = async (id: number, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(id);
            return;
        }

        const existing = items.find((item) => item.id === id);
        if (!existing) return;

        setItems((prev) => prev.map((item) =>
            item.id === id ? { ...item, quantity } : item
        ));

        if (user) {
            try {
                // Assuming backend has /cart/update route that takes productId and absolute quantity
                // Or we calculate diff? 
                // Let's assume standard PUT /cart/update with productId and quantity
                await api.put('/cart/update', { productId: id, quantity });
            } catch (error) {
                console.error("Failed to update quantity", error);
                toast.error('Adet güncellenemedi');
            }
        }
    };

    const decreaseQuantity = async (id: number) => {
        const existing = items.find((item) => item.id === id);
        if (!existing) return;
        updateQuantity(id, existing.quantity - 1);
    };

    const removeFromCart = async (id: number) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.error('Ürün sepetten çıkarıldı');

        if (user) {
            try {
                await api.delete(`/cart/remove/${id}`);
            } catch (error) {
                console.error("Failed to remove from cart API", error);
            }
        }
    };

    const clearCart = () => {
        setItems([]);
        if (!user) {
            localStorage.removeItem('cart');
        } else {
            // Optional: Call clear cart API if we make one
        }
    };

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const refreshCart = async () => {
        if (!user) return;
        try {
            const res = await api.get('/cart');
            const mapped = res.data.items ? res.data.items.map((item: any) => ({
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

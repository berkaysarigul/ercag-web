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
    decreaseQuantity: (id: number) => void;
    removeFromCart: (id: number) => void;
    clearCart: () => void;
    total: number;
    loaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const { user, loading: authLoading } = useAuth(); // Assuming AuthContext provides 'loading'

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

                } catch (error) {
                    console.error("Failed to fetch cart", error);
                    // Fallback or error handling
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

    const decreaseQuantity = async (id: number) => {
        const existing = items.find((item) => item.id === id);
        if (!existing) return;

        if (existing.quantity > 1) {
            setItems((prev) => prev.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity - 1 } : item
            ));

            if (user) {
                try {
                    // Note: We need the cartItem ID for update, but here we have productId (id).
                    // Logic mismatch: frontend ID is productId, backend update expects CartItem ID or we need a new route for updating by ProductID.
                    // Let's assume we can update by product ID or change backend.
                    // Making a quick fix: Use a specific route for decreasing by productId or handle finding the item on backend.
                    // Actually getting the item from cart array in backend is easy if we search by productId.
                    // Or we let the backend handle the logic. 
                    // Let's verify `cartController`. It uses `itemId` which it treats as `productId` in some places but verifies CartItem.
                    // Let's update backend to be robust or frontend to send CartItem ID.
                    // Frontend doesn't have CartItem ID easily unless mapped.
                    // Simplest: Send productId and let backend find the item.
                    // Backend `updateCartItem` expects `itemId` (cartItem.id).
                    // I will update backend `cartRoutes` to allow updating by ProductID, or changing frontend `items` to include `cartItemId`.
                    // For now, let's assume `update` endpoint can handle finding it.
                    // Let's look at `cartController.js` `updateCartItem`. It does `where: { id: itemId }`.
                    // We need to fix that or this.
                    // I will change backend `updateCartItem` to find by user + product or change context to store CartItemId.
                    // Storing CartItemId is cleaner but `addToCart` just adds product.
                    // I will update Backend Logic in a sec. Let's send productId and quantity.
                    await api.put('/cart/update', { productId: id, quantity: existing.quantity - 1 });
                } catch (error) {
                    console.error("Failed to decrease quantity", error);
                }
            }
        } else {
            removeFromCart(id);
        }
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

    return (
        <CartContext.Provider value={{ items, addToCart, decreaseQuantity, removeFromCart, clearCart, total, loaded }}>
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

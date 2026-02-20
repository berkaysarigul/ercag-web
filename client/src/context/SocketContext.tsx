'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        // Only connect if user is logged in? Or for guests too?
        // Request implies checking user role for admin notifications, so user context is needed.
        // Guests might need notifications for anonymous orders if tracking by session? 
        // Implementation uses userId from token.

        // Logic: Connect if token exists.
        const token = localStorage.getItem('token');
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => setIsConnected(true));
        newSocket.on('disconnect', () => setIsConnected(false));

        // Müşteri bildirimleri
        newSocket.on('order-status-update', (data: any) => {
            const statusMessages: Record<string, string> = {
                'PREPARING': '📦 Siparişiniz hazırlanıyor!',
                'READY': '✅ Siparişiniz HAZIR! Mağazadan teslim alabilirsiniz.',
                'COMPLETED': '🎉 Siparişiniz teslim edildi!',
                'CANCELLED': '❌ Siparişiniz iptal edildi.'
            };
            toast.info(statusMessages[data.status] || `Sipariş #${data.orderId} güncellendi.`);
        });

        // Admin bildirimleri
        newSocket.on('new-order', (data: any) => {
            if (user && ['SUPER_ADMIN', 'STAFF', 'ADMIN'].includes(user.role)) {
                toast.success(`🛒 Yeni sipariş! #${data.id} — ${data.fullName} (${Number(data.totalAmount).toFixed(2)} ₺)`);
                // Bildirim sesi - optional, browser might block auto-play
                try { new Audio('/notification.mp3').play().catch(() => { }); } catch (e) { }
            }
        });

        setSocket(newSocket);

        return () => { newSocket.disconnect(); };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}

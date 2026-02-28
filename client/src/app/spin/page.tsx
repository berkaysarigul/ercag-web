'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { Gift, Loader2, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface Prize { id: number; name: string; color: string | null; icon: string | null; }

export default function SpinPage() {
    const { user } = useAuth();
    const [code, setCode] = useState('');
    const [wheelData, setWheelData] = useState<{ wheelName: string; prizes: Prize[] } | null>(null);
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [rotation, setRotation] = useState(0);
    const [step, setStep] = useState<'input' | 'wheel' | 'result'>('input');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const WHEEL_SIZE = 340;

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        try {
            const res = await api.get(`/spin/wheel-info/${code.trim()}`);
            setWheelData(res.data);
            setStep('wheel');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Geçersiz kod');
        }
    };

    const drawWheel = () => {
        if (!wheelData || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const prizes = wheelData.prizes;
        const sliceAngle = (2 * Math.PI) / prizes.length;
        const centerX = WHEEL_SIZE / 2;
        const centerY = WHEEL_SIZE / 2;
        const radius = WHEEL_SIZE / 2 - 8;

        ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

        prizes.forEach((prize, idx) => {
            const startAngle = idx * sliceAngle - Math.PI / 2;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = prize.color || `hsl(${(idx * 360) / prizes.length}, 70%, 60%)`;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = prize.name.length > 14 ? prize.name.substring(0, 12) + '…' : prize.name;
            ctx.fillText(text, radius * 0.6, 0);
            ctx.restore();
        });

        // Merkez daire
        ctx.beginPath();
        ctx.arc(centerX, centerY, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    useEffect(() => {
        if (wheelData && step === 'wheel') {
            setTimeout(drawWheel, 100);
        }
    }, [wheelData, step]);

    const handleSpin = async () => {
        if (!user) { toast.error('Çarkı çevirmek için giriş yapmalısınız'); return; }
        if (spinning) return;
        setSpinning(true);

        try {
            const res = await api.post('/spin/spin', { code: code.trim() });
            const prizeIndex = res.data.prizeIndex;
            const prizes = wheelData!.prizes;
            const sliceAngle = 360 / prizes.length;
            const targetAngle = 360 - (prizeIndex * sliceAngle + sliceAngle / 2);
            const totalRotation = rotation + 360 * 5 + targetAngle;

            setRotation(totalRotation);

            setTimeout(() => {
                setResult(res.data);
                setStep('result');
                setSpinning(false);
            }, 4500);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Çevirme hatası');
            setSpinning(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
            <div className="max-w-md w-full">

                {/* ── KOD GİRİŞİ ── */}
                {step === 'input' && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Gift size={32} className="text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hediye Çarkı</h1>
                        <p className="text-gray-500 mb-6">Çark kodunuzu girerek şansınızı deneyin!</p>
                        <form onSubmit={handleCodeSubmit} className="space-y-4">
                            <input type="text" placeholder="Kodunuz (Örn: SPIN-A8F3K2)"
                                autoFocus
                                className="w-full text-center text-xl font-mono font-bold border-2 border-gray-200 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary/20 uppercase tracking-wider outline-none"
                                value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
                            <button type="submit"
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-colors">
                                Çarkı Getir
                            </button>
                        </form>
                    </div>
                )}

                {/* ── ÇARK ── */}
                {step === 'wheel' && wheelData && (
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{wheelData.wheelName}</h2>
                        <p className="text-gray-500 text-sm mb-6">Çevirmeye hazır mısınız? 🎰</p>

                        <div className="relative inline-block">
                            {/* Ok işareti */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10">
                                <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-md" />
                            </div>

                            {/* Çark Canvas */}
                            <div
                                className="transition-transform"
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    transitionDuration: spinning ? '4s' : '0s',
                                    transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)',
                                }}
                            >
                                <canvas ref={canvasRef} width={WHEEL_SIZE} height={WHEEL_SIZE} className="drop-shadow-xl rounded-full" />
                            </div>
                        </div>

                        <button onClick={handleSpin} disabled={spinning}
                            className={`mt-8 w-full py-4 rounded-xl font-bold text-lg transition-all ${spinning
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary-dark shadow-lg hover:shadow-xl hover:-translate-y-0.5'}`}>
                            {spinning ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" size={20} /> Çevriliyor...
                                </span>
                            ) : '🎰 Çarkı Çevir!'}
                        </button>
                    </div>
                )}

                {/* ── SONUÇ ── */}
                {step === 'result' && result && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        {result.prize?.type !== 'EMPTY' ? (
                            <>
                                <PartyPopper size={48} className="text-amber-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tebrikler! 🎉</h2>
                                <p className="text-lg text-primary font-bold mb-4">{result.prize?.name}</p>
                                {result.couponCode && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-green-700 mb-1">Kupon Kodunuz:</p>
                                        <p className="text-2xl font-mono font-bold text-green-900 tracking-wider">{result.couponCode}</p>
                                        <p className="text-xs text-green-600 mt-1">Bu kodu sepette kullanabilirsiniz</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="text-5xl mb-4">😔</div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Bu sefer olmadı</h2>
                                <p className="text-gray-500">Bir dahaki sefere şansınız daha yaver gidecek!</p>
                            </>
                        )}
                        <p className="text-sm text-gray-400 mt-4">{result.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

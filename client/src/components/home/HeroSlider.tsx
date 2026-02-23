'use client';

import React, { useCallback, useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function HeroSlider() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
    const [slides, setSlides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
        emblaApi.on('select', onSelect);
        return () => { emblaApi.off('select', onSelect); };
    }, [emblaApi]);

    useEffect(() => {
        api.get('/hero-slides/active')
            .then(res => setSlides(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="h-[380px] md:h-[460px] bg-gradient-to-br from-blue-900 to-blue-700 animate-pulse" />
    );

    if (slides.length === 0) return null;

    return (
        <section className="relative overflow-hidden" style={{ marginTop: 0 }}>
            {/* Embla */}
            <div className="embla" ref={emblaRef}>
                <div className="embla__container flex">
                    {slides.map((slide, index) => {
                        const imgSrc = slide.imageUrl?.startsWith('http')
                            ? slide.imageUrl
                            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${slide.imageUrl}`;

                        return (
                            <div
                                key={slide.id || index}
                                className="embla__slide flex-[0_0_100%] min-w-0 relative h-[380px] md:h-[460px]"
                            >
                                {/* Background */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[8000ms]"
                                    style={{ backgroundImage: `url(${imgSrc})` }}
                                />
                                {/* Gradient overlay — bottom-heavy so text pops */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                                {/* Content */}
                                <div className="container relative z-10 h-full flex items-center">
                                    <div className="max-w-xl text-white">
                                        {slide.subtitle && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full mb-4 block w-fit">
                                                {slide.subtitle}
                                            </span>
                                        )}
                                        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-3 drop-shadow-lg">
                                            {slide.title}
                                        </h1>
                                        {slide.description && (
                                            <p className="text-base md:text-lg text-white/80 mb-6 leading-relaxed max-w-md">
                                                {slide.description}
                                            </p>
                                        )}
                                        {slide.link && (
                                            <Link
                                                href={slide.link}
                                                className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 active:scale-95 transition-all shadow-xl"
                                            >
                                                İncele <ArrowRight size={18} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Prev / Next buttons */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={scrollPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/15 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all"
                        aria-label="Önceki"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/15 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all"
                        aria-label="Sonraki"
                    >
                        <ArrowRight size={20} />
                    </button>
                </>
            )}

            {/* Dot indicators */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => emblaApi?.scrollTo(i)}
                            className={`transition-all duration-300 rounded-full ${i === selectedIndex
                                    ? 'w-6 h-2 bg-white'
                                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                                }`}
                            aria-label={`Slayt ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

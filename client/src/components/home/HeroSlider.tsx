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
        <div className="min-h-[85vh] md:min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
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
                                className="embla__slide flex-[0_0_100%] min-w-0 relative min-h-[85vh] md:min-h-screen group flex items-center"
                            >
                                {/* Background */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[8000ms]"
                                    style={{ backgroundImage: `url(${imgSrc})` }}
                                />
                                {/* Gradient overlay - Balanced for both text and image visibility */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />

                                {/* Content */}
                                <div className="container relative z-10 w-full px-6 md:px-12 mt-16 md:mt-24">
                                    <div className="max-w-3xl text-white">
                                        {slide.subtitle && (
                                            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-sm text-white/90 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 w-fit">
                                                {slide.subtitle}
                                            </span>
                                        )}
                                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white font-medium leading-[1.05] mb-6 drop-shadow-md">
                                            {slide.title}
                                        </h1>
                                        {slide.description && (
                                            <p className="text-lg md:text-2xl text-white/90 mb-10 leading-relaxed max-w-2xl font-light drop-shadow">
                                                {slide.description}
                                            </p>
                                        )}
                                        {slide.link && (
                                            <Link
                                                href={slide.link}
                                                className="px-10 py-4 bg-white text-primary font-bold rounded-full hover:bg-gray-50 hover:scale-105 hover:shadow-xl shadow-lg inline-flex items-center gap-3 transition-all w-fit text-lg"
                                            >
                                                Koleksiyonu Keşfet <ArrowRight size={20} />
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20 transition-all opacity-0 md:opacity-100 group-hover:opacity-100"
                        aria-label="Önceki"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20 transition-all opacity-0 md:opacity-100 group-hover:opacity-100"
                        aria-label="Sonraki"
                    >
                        <ArrowRight size={20} />
                    </button>
                </>
            )}

            {/* Dot indicators */}
            {slides.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => emblaApi?.scrollTo(i)}
                            className={`transition-all duration-300 rounded-full ${i === selectedIndex
                                ? 'w-8 h-2 bg-white'
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

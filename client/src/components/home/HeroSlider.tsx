'use client';

import React, { useCallback, useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function HeroSlider() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
    const [slides, setSlides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const res = await api.get('/hero-slides/active');
                setSlides(res.data);
            } catch (error) {
                console.error('Failed to fetch slides', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSlides();
    }, []);

    if (loading) return <div className="h-[400px] md:h-[500px] bg-gray-100 flex items-center justify-center animate-pulse"></div>;

    // Fallback if no slides
    if (slides.length === 0) return null;

    return (
        <section className="relative overflow-hidden min-h-[500px] md:min-h-[600px]">
            <div className="absolute inset-0 z-0">
                <div className="embla h-full" ref={emblaRef}>
                    <div className="embla__container h-full flex">
                        {slides.map((slide, index) => (
                            <div key={slide.id || index} className="embla__slide flex-[0_0_100%] min-w-0 relative h-[500px] md:h-[600px]">
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${slide.imageUrl.startsWith('http') ? slide.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${slide.imageUrl}`})`
                                    }}
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/40" />
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
                                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-3xl animate-pulse delay-700" />
                                </div>

                                <div className="container mx-auto px-4 h-full flex items-center relative z-10 py-20">
                                    <div className="max-w-3xl mx-auto md:mx-0 text-center md:text-left">
                                        {slide.subtitle && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5 }}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white mb-6"
                                            >
                                                <span className="text-sm font-bold uppercase tracking-wider">{slide.subtitle}</span>
                                            </motion.div>
                                        )}

                                        <motion.h1
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight"
                                        >
                                            {slide.title}
                                        </motion.h1>

                                        <motion.p
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.4 }}
                                            className="text-lg md:text-xl text-blue-50 mb-10 max-w-2xl"
                                        >
                                            {slide.description}
                                        </motion.p>

                                        {slide.link && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: 0.6 }}
                                                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
                                            >
                                                <Link href={slide.link} className="btn bg-white text-gray-900 hover:bg-gray-100 hover:text-primary px-8 py-4 rounded-xl text-lg font-bold shadow-xl transition-all flex items-center justify-center gap-2">
                                                    İncele <ArrowRight size={20} />
                                                </Link>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation Buttons */}
            <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all hidden md:flex"
                onClick={scrollPrev}
            >
                <ArrowRight className="rotate-180" size={24} />
            </button>
            <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all hidden md:flex"
                onClick={scrollNext}
            >
                <ArrowRight size={24} />
            </button>
        </section>
    );
}

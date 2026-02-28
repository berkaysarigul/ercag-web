'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ArrowRight, ShoppingBag, Clock, CheckCircle2, MapPin, ChevronDown, ChevronUp, Zap, BookOpen, PenTool, Palette, FileText, FolderOpen, Scissors, Backpack, Briefcase, Music, Package, Truck, CreditCard, Shield, Star, Sparkles } from 'lucide-react';
import HeroSlider from '@/components/home/HeroSlider';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import DiscountedProducts from '@/components/home/DiscountedProducts';
import CampaignBanner from '@/components/ui/CampaignBanner';
import { useSettings } from '@/context/SettingsContext';

interface Category {
  id: number;
  name: string;
  image: string | null;
  _count?: { products: number };
}

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('defter')) return <BookOpen size={24} />;
  if (lower.includes('kalem')) return <PenTool size={24} />;
  if (lower.includes('boya') || lower.includes('sanat')) return <Palette size={24} />;
  if (lower.includes('kağıt')) return <FileText size={24} />;
  if (lower.includes('dosya')) return <FolderOpen size={24} />;
  if (lower.includes('makas')) return <Scissors size={24} />;
  if (lower.includes('okul')) return <Backpack size={24} />;
  if (lower.includes('ofis')) return <Briefcase size={24} />;
  if (lower.includes('müzik')) return <Music size={24} />;
  return <Package size={24} />;
}

const CATEGORY_COLORS = [
  { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500', border: 'border-emerald-100', hover: 'hover:bg-emerald-100' },
  { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500', border: 'border-blue-100', hover: 'hover:bg-blue-100' },
  { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500', border: 'border-amber-100', hover: 'hover:bg-amber-100' },
  { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500', border: 'border-purple-100', hover: 'hover:bg-purple-100' },
  { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500', border: 'border-rose-100', hover: 'hover:bg-rose-100' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-500', border: 'border-cyan-100', hover: 'hover:bg-cyan-100' },
];

const HOW_IT_WORKS = [
  {
    icon: ShoppingBag,
    step: '01',
    title: 'Sepete Ekle',
    desc: 'İhtiyacınız olan kırtasiye ürünlerini seçin, sepetinize ekleyin.',
    color: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100',
  },
  {
    icon: CheckCircle2,
    step: '02',
    title: 'Siparişi Oluştur',
    desc: 'Online ödeme yok — siparişi tamamla, teslimat kodun SMS ile gelsin.',
    color: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-100',
  },
  {
    icon: MapPin,
    step: '03',
    title: 'Mağazadan Teslim Al',
    desc: 'Mağazamıza gel, kasada öde, ürünlerini hemen götür.',
    color: 'bg-amber-50 text-amber-600',
    border: 'border-amber-100',
  },
];

const FAQS = [
  {
    q: 'Ödemeyi nerede yapıyorum?',
    a: 'Ödemenizi siparişi teslim alırken mağazamızdaki kasada nakit veya kredi kartı ile yapabilirsiniz. Online ödeme alınmamaktadır.',
  },
  {
    q: 'Siparişim ne kadar sürede hazırlanır?',
    a: 'Siparişleriniz genellikle 30–60 dakika içerisinde hazırlanmaktadır. Hazır olduğunda SMS ile bilgilendirileceksiniz.',
  },
  {
    q: 'Siparişimi ne kadar sürede almalıyım?',
    a: 'Hazırlanan siparişler 3 iş günü boyunca mağazamızda bekletilir.',
  },
  {
    q: 'Kargo ile gönderim yapıyor musunuz?',
    a: 'Şu anda sadece mağazadan teslim (Click & Collect) yöntemiyle çalışıyoruz. Siparişinizi mağazamızdan teslim alabilirsiniz.',
  },
];

const ADVANTAGES = [
  { icon: CreditCard, title: 'Kasada Öde', desc: 'Online ödeme zorunluluğu yok', color: 'text-blue-600' },
  { icon: Clock, title: 'Hızlı Hazırlık', desc: 'Siparişiniz 30-60 dk\'da hazır', color: 'text-emerald-600' },
  { icon: Shield, title: 'Güvenli Alışveriş', desc: 'Ürünü görüp alın', color: 'text-amber-600' },
  { icon: Truck, title: 'Sıra Beklemeyin', desc: 'Hazır sipariş, hızlı teslim', color: 'text-purple-600' },
];

export default function Home() {
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────── */}
      <HeroSlider />

      {/* ── Campaign Banner ──────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-20">
        <CampaignBanner />
      </div>

      {/* ── Avantajlar Bandı ─────────────────────────── */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ADVANTAGES.map((adv) => (
              <div key={adv.title} className="flex items-center gap-3 px-4 py-3">
                <div className={`shrink-0 ${adv.color}`}>
                  <adv.icon size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{adv.title}</p>
                  <p className="text-xs text-gray-500">{adv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary bg-brand-50 px-3 py-1.5 rounded-full mb-3">
              <Zap size={12} /> Click & Collect
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Nasıl Çalışır?</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">3 adımda siparişini ver, mağazamızdan teslim al.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[calc(33%+16px)] right-[calc(33%+16px)] h-px bg-gradient-to-r from-blue-200 via-emerald-200 to-amber-200 z-0" />

            {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc, color, border }) => (
              <div key={step} className={`relative bg-white rounded-2xl p-7 border ${border} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 z-10`}>
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <Icon size={26} />
                  </div>
                  <span className="text-5xl font-black text-gray-100 select-none">{step}</span>
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mağaza Tanıtım Bandı ─────────────────────────────── */}
      <section className="py-16 bg-primary">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                Kırtasiye ihtiyaçlarınız için<br />
                <span className="text-white/70 font-normal italic">güvenilir adresiniz.</span>
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                Öğrenciden ofis çalışanına, sanatçıdan öğretmene — herkesin ihtiyacına uygun geniş ürün yelpazesi. Kaliteli markalar, uygun fiyatlar.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/products" className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                  Ürünleri Keşfet <ArrowRight size={18} />
                </Link>
                <Link href="/products?sort=newest" className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors border border-white/20 inline-flex items-center gap-2">
                  <Sparkles size={16} /> Yeni Gelenler
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="text-white/70 text-sm mt-1">Ürün Çeşidi</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <p className="text-3xl font-bold text-white">50+</p>
                <p className="text-white/70 text-sm mt-1">Marka</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <p className="text-3xl font-bold text-white">30 dk</p>
                <p className="text-white/70 text-sm mt-1">Ort. Hazırlık</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <p className="text-3xl font-bold text-white">Kasada</p>
                <p className="text-white/70 text-sm mt-1">Ödeme Kolaylığı</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fırsat Ürünleri ──────────────────────────────── */}
      <DiscountedProducts />

      {/* ── Featured Products ─────────────────────────── */}
      <FeaturedProducts />

      {/* ── Kategoriler ───────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Kategoriler</h2>
              <p className="text-gray-500 mt-2">İhtiyacına uygun kategoriyi seç, ürünleri keşfet.</p>
            </div>
            <Link href="/products" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
              Tümünü Gör <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-[140px] animate-pulse border border-gray-100" />
              ))
              : categories.slice(0, 6).map((cat, idx) => {
                const colors = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                return (
                  <Link key={cat.id} href={`/products?category=${cat.id}`}
                    className={`group ${colors.bg} ${colors.border} border rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${colors.hover}`}>
                    <div className={`w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center ${colors.icon} group-hover:scale-110 transition-transform shadow-sm`}>
                      {getCategoryIcon(cat.name)}
                    </div>
                    <div>
                      <h3 className={`font-semibold text-sm ${colors.text}`}>{cat.name}</h3>
                      {cat._count?.products !== undefined && (
                        <p className="text-xs text-gray-400 mt-0.5">{cat._count.products} ürün</p>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── SSS (FAQ) ─────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Sıkça Sorulan Sorular</h2>
            <p className="text-gray-500 mt-2">Click & Collect hakkında merak ettikleriniz.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center px-6 py-4 text-left"
                >
                  <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Bandı ─────────────────────────────────── */}
      <section className="py-14 bg-primary/5">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            İhtiyacın olan her şey bir tık uzağında
          </h2>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto">
            Sipariş ver, hazırlansın, mağazamızdan teslim al. Online ödeme yok, sıra bekleme yok.
          </p>
          <Link href="/products" className="px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors inline-flex items-center gap-2 shadow-lg">
            Alışverişe Başla <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  );
}

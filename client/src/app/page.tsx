'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import api from '@/lib/api';
import { ArrowRight, ShoppingBag, Clock, CheckCircle2, MapPin, Phone, Mail, ChevronDown, ChevronUp, Zap, Lock, CreditCard, ShieldCheck } from 'lucide-react';
import HeroSlider from '@/components/home/HeroSlider';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import CampaignBanner from '@/components/ui/CampaignBanner';
import { useSettings } from '@/context/SettingsContext';

interface Category {
  id: number;
  name: string;
  image: string | null;
  _count?: { products: number };
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'defter': '📓', 'kalem': '✏️', 'boya': '🎨', 'kağıt': '📄', 'dosya': '📁',
  'makas': '✂️', 'okul': '🎒', 'ofis': '💼', 'sanat': '🖌️', 'müzik': '🎵',
};

function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return name.charAt(0).toUpperCase();
}

const CATEGORY_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
  'from-yellow-500 to-orange-500',
  'from-fuchsia-500 to-purple-600',
];

const HOW_IT_WORKS = [
  {
    icon: ShoppingBag,
    step: '01',
    title: 'Sepete Ekle',
    desc: 'İhtiyacınız olan ürünleri seçin, sepetinize ekleyin.',
    color: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100',
  },
  {
    icon: CheckCircle2,
    step: '02',
    title: 'Siparişi Oluştur',
    desc: 'Ödeme yapmadan siparişini tamamla; teslim kodu SMS ile gelir.',
    color: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-100',
  },
  {
    icon: MapPin,
    step: '03',
    title: 'Mağazadan Teslim Al',
    desc: 'Gel, kasada öde, ürünlerini hemen götür.',
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
    a: 'Siparişleriniz genellikle 30–60 dakika içerisinde hazırlanmaktadır. Hazır olduğunda SMS ile bilgi verilecektir.',
  },
  {
    q: 'Siparişi ne kadar sürede almalıyım?',
    a: 'Hazırlanan siparişler 3 iş günü boyunca mağazamızda bekletilir.',
  },
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
      <CampaignBanner />

      {/* ── How It Works ─────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--primary)] bg-blue-50 px-3 py-1.5 rounded-full mb-3">
              <Zap size={12} /> Click & Collect
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Nasıl Çalışır?</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">3 adımda siparişini ver, mağazamızdan teslim al.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[calc(33%+16px)] right-[calc(33%+16px)] h-px bg-gradient-to-r from-blue-200 via-emerald-200 to-amber-200 z-0" />

            {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc, color, border }) => (
              <div key={step} className={`relative bg-white rounded-2xl p-8 border ${border} shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 z-10`}>
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <Icon size={26} />
                  </div>
                  <span className="text-5xl font-black text-gray-100 leading-none select-none">{step}</span>
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────── */}
      <FeaturedProducts />

      {/* ── Categories ───────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Kategoriler</h2>
              <p className="text-gray-500 mt-1">İhtiyacınız olan her şey burada</p>
            </div>
            <Link href="/products" className="flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:underline underline-offset-2 shrink-0">
              Tümünü Gör <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />
              ))
              : categories.map((cat, idx) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Gradient top bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length]}`} />
                  <div className="p-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length]} flex items-center justify-center text-white text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {getCategoryEmoji(cat.name)}
                    </div>
                    <h3 className="font-bold text-gray-800 group-hover:text-[var(--primary)] transition-colors">{cat.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 group-hover:text-[var(--primary)] transition-colors">
                      Ürünleri Keşfet <ArrowRight size={11} />
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ── Store Info + FAQ ──────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Store Info */}
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">Mağaza Bilgileri</h2>
            <div className="bg-gradient-to-br from-[var(--primary)] to-blue-700 rounded-2xl p-8 text-white space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide font-semibold mb-1">Adres</p>
                  <p className="text-white whitespace-pre-line leading-relaxed">
                    {settings.site_address || 'Atatürk Caddesi No: 123\nMerkez, İstanbul'}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10" />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide font-semibold mb-1">Çalışma Saatleri</p>
                  <p className="text-white">{settings.working_hours || 'Pazartesi – Cumartesi: 09:00 – 19:00'}</p>
                </div>
              </div>

              <div className="border-t border-white/10" />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide font-semibold mb-1">İletişim</p>
                  <p className="text-white">{settings.site_phone || '0212 123 45 67'}</p>
                  {settings.site_email && (
                    <p className="text-white/80 text-sm mt-0.5">{settings.site_email}</p>
                  )}
                </div>
              </div>

              <Link
                href="/products"
                className="mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-white text-[var(--primary)] rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-lg"
              >
                Alışverişe Başla <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">Sıkça Sorulan Sorular</h2>
            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                    {openFaq === idx
                      ? <ChevronUp size={18} className="text-[var(--primary)] shrink-0" />
                      : <ChevronDown size={18} className="text-gray-400 shrink-0" />
                    }
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-5">
                      <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { Icon: Lock, label: 'Güvenli Alışveriş' },
                { Icon: Zap, label: 'Hızlı Hazırlık' },
                { Icon: CreditCard, label: 'Kasada Ödeme' },
                { Icon: ShieldCheck, label: 'Kaliteli Ürünler' },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <Icon size={20} className="text-[var(--primary)]" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

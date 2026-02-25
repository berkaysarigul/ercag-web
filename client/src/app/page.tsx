'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ArrowRight, ShoppingBag, Clock, CheckCircle2, MapPin, Phone, Mail, ChevronDown, ChevronUp, Zap, Lock, CreditCard, BadgeCheck, PenTool, BookOpen, Palette, FileText, FolderOpen, Scissors, Backpack, Briefcase, Music, Package, Star } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-20">
        <CampaignBanner />
      </div>

      {/* ── How It Works ─────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full mb-3">
              <Zap size={12} /> Click & Collect
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Nasıl Çalışır?</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">3 adımda siparişini ver, mağazamızdan teslim al.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* connector line (desktop) */}
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

      {/* ── Wide Green Banner (Eco Design Reference) ───────────────── */}
      <section className="py-16 bg-[#e1efe8]">
        <div className="container">
          <div className="relative rounded-2xl overflow-hidden h-[400px] flex items-center shadow-lg group">
            <div className="absolute inset-0 bg-[#264a3d] mix-blend-multiply opacity-80 z-10" />
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2670&auto=format&fit=crop)' }}
            />
            <div className="relative z-20 p-8 md:p-16 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight mb-4">
                Yıllarca güvenebileceğiniz <span className="italic">ürünler</span> tasarlıyoruz —
              </h2>
              <p className="text-white/90 text-lg">
                Günlük yaşamınıza değer katan, sürdürülebilir malzemelerle özenle üretilmiş kullanışlı parçalar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────── */}
      <FeaturedProducts />

      {/* ── Category Pills (Eco Design Reference) ──────────────── */}
      <section className="py-8 bg-background">
        <div className="container flex flex-wrap justify-center gap-4">
          <button className="px-8 py-4 rounded-full bg-[#f2f7f5] text-primary font-serif italic text-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#c5e0d4] flex items-center justify-center text-xs">🌿</span> Doğal Dokular
          </button>
          <button className="px-8 py-4 rounded-full bg-[#f2f7f5] text-primary font-serif italic text-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#c5e0d4] flex items-center justify-center text-xs">♻️</span> Çevre Dostu
          </button>
          <button className="px-8 py-4 rounded-full bg-[#f2f7f5] text-primary font-serif italic text-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#c5e0d4] flex items-center justify-center text-xs">🌱</span> Sürdürülebilir
          </button>
        </div>
      </section>

      {/* ── Categories (Gallery Style) ───────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="flex flex-col mb-10 gap-2">
            <h2 className="text-3xl font-serif text-gray-900 tracking-tight">
              Gezegen dostu ve özenle seçilmiş<br />kategorilerimizi <span className="italic font-normal opacity-80">Keşfedin</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#E8E8E0] rounded-2xl h-[300px] animate-pulse" />
              ))
              : categories.slice(0, 4).map((cat, idx) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="group relative rounded-2xl overflow-hidden h-[300px] hover:shadow-xl transition-all duration-500 hover:-translate-y-1 block"
                >
                  <div className={`absolute inset-0 bg-gradient-to-t ${CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length]} opacity-60 mix-blend-multiply z-10 transition-opacity group-hover:opacity-40`} />
                  <div className="absolute inset-0 bg-[#264a3d] opacity-20 z-10" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 text-center">
                    <h3 className="font-serif text-2xl font-medium text-white mb-4 drop-shadow-md">
                      Keşfet<br /><span className="italic opacity-90">{cat.name}</span>
                    </h3>
                    <span className="px-6 py-2 bg-[#f4f4f0]/90 backdrop-blur-sm text-primary text-xs font-bold rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                      Sonuçları Gör →
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials (Eco Design Reference) ──────────────────────────── */}
      <section className="py-20 bg-[#e1efe8]/30">
        <div className="container max-w-6xl">
          <div className="bg-[#E8E8E0] rounded-3xl p-8 md:p-12 shadow-inner">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#d1d1c4]">
              <div className="text-4xl font-serif font-medium text-gray-900">4.9<span className="text-lg text-gray-500">/5</span></div>
              <div>
                <div className="flex text-amber-500 mb-1">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-xs text-gray-600">Ayrıcalıklı kalite ve hizmet deneyimi sunan markamız için<br /> Bize güvenen <strong className="text-gray-900">15,000</strong>'den fazla Müşteri.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Review 1 */}
              <div className="bg-[#F4F4F0] p-6 rounded-2xl">
                <span className="text-3xl font-serif text-[#c5e0d4] leading-none">"</span>
                <p className="text-sm text-gray-700 italic mb-6">Erçağ'ın kırtasiye ürünleri masamı düzenlemek için harika, sürdürülebilir malzemeleri de günlük kullanıma çok uygun!</p>
                <p className="text-xs font-bold text-gray-900">Zeynep K. <span className="font-normal text-gray-500 block">Öğretmen</span></p>
              </div>
              {/* Review 2 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm transform md:-translate-y-4">
                <span className="text-3xl font-serif text-[#c5e0d4] leading-none">"</span>
                <p className="text-sm text-gray-700 italic mb-6">Muhteşem ürünler ve çok hızlı teslimat. Çalışma alanım artık çok daha yeşil hissettiriyor!</p>
                <p className="text-xs font-bold text-gray-900">Deniz A. <span className="font-normal text-gray-500 block">Tasarımcı</span></p>
              </div>
              {/* Review 3 */}
              <div className="bg-[#F4F4F0] p-6 rounded-2xl">
                <span className="text-3xl font-serif text-[#c5e0d4] leading-none">"</span>
                <p className="text-sm text-gray-700 italic mb-6">Erçağ'ın tasarımlarına bayılıyorum. Hem ofis masamı çok şık gösteriyor hem de oldukça kaliteliler.</p>
                <p className="text-xs font-bold text-gray-900">Ahmet Y. <span className="font-normal text-gray-500 block">Mimar</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Eco Footer Banner ──────────────────────────── */}
      <section className="py-20 bg-background text-center">
        <div className="container max-w-3xl">
          <p className="text-xl md:text-2xl font-serif text-gray-800 leading-relaxed">
            Daha sağlıklı bir gezegen ve <span className="italic font-bold text-primary">daha yeşil bir dünya</span> için <span className="italic font-medium">sürdürülebilir</span> malzemeler, düşük çevre etkili üretim ve <span className="italic font-medium">etik tedarik</span> anlayışına olan bağlılığımızı deneyimleyin.
          </p>
        </div>
      </section>

    </div>
  );
}

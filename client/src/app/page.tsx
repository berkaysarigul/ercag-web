'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, ShoppingBag, Star, TrendingUp, Rocket } from "lucide-react";

interface Category {
  id: number;
  name: string;
  image: string | null;
}

export default function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 min-h-[600px] flex items-center pt-10">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 w-full">
          <div className="max-w-3xl mx-auto text-center lg:text-left lg:mx-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full mb-8 animate-fade-in mx-auto lg:mx-0 shadow-lg">
              <Rocket className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700 text-sm font-bold uppercase tracking-wide">
                Mağazadan Hızlı Teslimat
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight animate-slide-up drop-shadow-md">
              Kırtasiye Alışverişinin
              <span className="block text-yellow-400 mt-2">
                En Modern Hali
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-white mb-10 max-w-2xl mx-auto lg:mx-0 animate-slide-up delay-100 font-medium">
              Okul, ofis ve sanatsal tüm ihtiyaçlarınız tek tıkla sepetinizde.
              Sıra beklemeden, mağazadan teslim alın.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up delay-200">
              <Link href="/products" className="
              group
              px-8 py-4 
              bg-white text-blue-700
              font-bold text-lg
              rounded-xl
              shadow-xl hover:shadow-2xl hover:bg-gray-50
              transform hover:scale-105
              transition-all duration-300
              flex items-center justify-center gap-3
            ">
                <ShoppingBag className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Alışverişe Başla
              </Link>

              <button className="
              px-8 py-4
              border-2 border-white/50
              text-white font-semibold text-lg
              rounded-xl
              backdrop-blur-sm
              hover:bg-white/10 hover:border-white
              transition-all duration-300
            ">
                Nasıl Çalışır?
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 animate-fade-in delay-300 bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/20 shadow-inner">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">500+</div>
                <div className="text-blue-100 text-sm font-medium">Ürün Çeşidi</div>
              </div>
              <div className="text-center border-l border-white/20">
                <div className="text-3xl font-bold text-white mb-1">10dk</div>
                <div className="text-blue-100 text-sm font-medium">Ortalama Hazırlık</div>
              </div>
              <div className="text-center border-l border-white/20">
                <div className="text-3xl font-bold text-white mb-1">4.9⭐</div>
                <div className="text-blue-100 text-sm font-medium">Müşteri Memnuniyeti</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Wave */}
        <div className="absolute -bottom-1 left-0 right-0 text-white z-20">
          <svg viewBox="0 0 1440 120" className="w-full h-auto fill-white block">
            <path
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Features Strip */}
      <div className="bg-white border-b border-gray-100 py-12">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Nasıl Çalışır?</h2>
            <p className="text-gray-500 mt-2">Siparişinizi 3 adımda kolayca teslim alın.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={32} />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">1. Sepete Ekle</h3>
              <p className="text-gray-500">İhtiyacınız olan ürünleri seçin ve sepetinize ekleyin.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <TrendingUp size={32} />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">2. Siparişi Oluştur</h3>
              <p className="text-gray-500">Ödeme yapmadan siparişini tamamla. Teslimat kodunu al.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                <Star size={32} />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">3. Mağazadan Teslim Al</h3>
              <p className="text-gray-500">Mağazaya gel, ödemeni kasada yap ve ürünlerini hemen teslim al.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Store Info & FAQ */}
      <section className="py-20 bg-white">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-6">Mağaza Bilgileri</h2>
            <div className="space-y-6 bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Adres</h4>
                <p className="text-gray-600">Atatürk Caddesi No: 123, Merkez, İstanbul</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Çalışma Saatleri</h4>
                <p className="text-gray-600">Pazartesi - Cumartesi: 09:00 - 19:00</p>
                <p className="text-gray-600">Pazar: Kapalı</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">İletişim</h4>
                <p className="text-gray-600">Telefon: 0212 123 45 67</p>
                <p className="text-gray-600">WhatsApp: 0555 123 45 67</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-primary mb-6">Sıkça Sorulan Sorular</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-5 hover:border-secondary transition-colors cursor-pointer group">
                <h4 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">Ödemeyi nerede yapıyorum?</h4>
                <p className="text-gray-600 mt-2">Ödemenizi siparişi teslim alırken mağazamızdaki kasada nakit veya kredi kartı ile yapabilirsiniz. Online ödeme alınmamaktadır.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-5 hover:border-secondary transition-colors cursor-pointer group">
                <h4 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">Siparişim ne kadar sürede hazırlanır?</h4>
                <p className="text-gray-600 mt-2">Siparişleriniz genellikle 30-60 dakika içerisinde hazırlanmaktadır. Hazır olduğunda size SMS ile bilgi verilecektir.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-5 hover:border-secondary transition-colors cursor-pointer group">
                <h4 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">Siparişi ne kadar sürede almalıyım?</h4>
                <p className="text-gray-600 mt-2">Hazırlanan siparişler 3 iş günü boyunca mağazamızda bekletilir.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-2">Kategoriler</h2>
              <p className="text-gray-500">İhtiyacınız olan her şey burada</p>
            </div>
            <Link href="/products" className="text-secondary hover:text-secondary-hover font-semibold flex items-center gap-1 transition-colors">
              Tümünü Gör <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                href={`/products?category=${cat.id}`}
                key={cat.id}
                className="group bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-xl border border-gray-100 hover:border-secondary/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-6 group-hover:bg-secondary/10 group-hover:text-secondary transition-colors duration-300">
                  {cat.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-sm text-gray-400 mt-2 group-hover:text-secondary transition-colors">Ürünleri İncele</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

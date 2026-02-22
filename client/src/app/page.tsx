'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, ShoppingBag, Star, TrendingUp, Rocket } from "lucide-react";
import HeroSlider from "@/components/home/HeroSlider";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Skeleton from "@/components/ui/Skeleton";
import CampaignBanner from "@/components/ui/CampaignBanner";

interface Category {
  id: number;
  name: string;
  image: string | null;
}

import { useSettings } from "@/context/SettingsContext";

export default function Home() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSlider />

      {/* Campaign Banner */}
      <CampaignBanner />

      {/* Featured Products */}
      <FeaturedProducts />

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
                <p className="text-gray-600 whitespace-pre-line">{settings.site_address || "Atatürk Caddesi No: 123, Merkez, İstanbul"}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Çalışma Saatleri</h4>
                {/* UI-13: settings'ten dinamik çalışma saatleri */}
                <p className="text-gray-600">{settings.working_hours || "Pazartesi - Cumartesi: 09:00 - 19:00"}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">İletişim</h4>
                <p className="text-gray-600">Telefon: {settings.site_phone || "0212 123 45 67"}</p>
                <p className="text-gray-600">Email: {settings.site_email || "info@ercagkirtasiye.com"}</p>
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
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                  <div className="flex justify-center mb-6">
                    <Skeleton variant="circular" width={80} height={80} />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </div>
                </div>
              ))
            ) : categories.map((cat) => (
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

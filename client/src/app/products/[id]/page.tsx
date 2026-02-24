import ProductDetailClient from '@/components/products/ProductDetailClient';
import api from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        // Use fetch for server-side data fetching to avoid axios issues or use absolute URL
        const res = await fetch(`${API_URL}/api/products/${id}`);
        if (!res.ok) return { title: 'Ürün Bulunamadı' };

        const product = await res.json();
        return {
            title: product.name,
            description: product.description.substring(0, 160),
            openGraph: {
                images: product.image ? [`${API_URL}/uploads/${product.image}`] : [],
            },
        };
    } catch (error) {
        return {
            title: 'Ürün Bulunamadı',
        };
    }
}

async function getProduct(id: string) {
    try {
        const res = await fetch(`${API_URL}/api/products/${id}`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error('Failed to fetch product', error);
        return null;
    }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        return <div className="container py-12 text-center">Ürün bulunamadı.</div>;
    }

    // Ensure stock is present, default to 0 if not provided by API yet (though it should be)
    const productWithStock = { ...product, stock: product.stock ?? 0 };

    return <ProductDetailClient product={productWithStock} />;
}

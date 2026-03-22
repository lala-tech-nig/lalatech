import React from 'react';
import { API_BASE_URL } from '@/lib/api';
import ProductDetailClient from './ProductDetailClient';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const res = await fetch(`${API_BASE_URL}/products/slug/${slug}`, { next: { revalidate: 60 } });
        if (res.ok) {
            const product = await res.json();
            return {
                title: `${product.title} | Lala Tech Shop`,
                description: product.description || `Buy ${product.title} from Lala Tech Official Shop.`,
                openGraph: {
                    title: product.title,
                    description: product.description || `Buy ${product.title} from Lala Tech Official Shop.`,
                    images: product.image ? [product.image] : [],
                    type: 'website',
                },
                twitter: {
                    card: 'summary_large_image',
                    title: product.title,
                    description: product.description || `Buy ${product.title} from Lala Tech Official Shop.`,
                    images: product.image ? [product.image] : [],
                }
            };
        }
    } catch (e) {
        console.error('Metadata fetch error:', e);
    }

    return {
        title: 'Product | Lala Tech Shop',
        description: 'Premium tech products from Lala Tech.',
    };
}

export default async function ProductPage({ params }) {
    const { slug } = await params;
    let product = null;

    try {
        const res = await fetch(`${API_BASE_URL}/products/slug/${slug}`, { next: { revalidate: 60 } });
        if (res.ok) {
            product = await res.json();
        }
    } catch (e) {
        console.error('Product fetch error:', e);
    }

    return <ProductDetailClient initialProduct={product} slug={slug} />;
}

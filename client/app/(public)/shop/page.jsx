'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';

export default function ShopPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/products`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20 pt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 mt-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        Lala Tech Shop
                    </h1>
                    <p className="text-xl text-gray-600">
                        Explore our premium tech products, gadgets, and accessories.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center bg-white rounded-2xl p-12 shadow-sm border border-gray-100">
                        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Shop is Empty</h3>
                        <p className="text-gray-500">We are currently restocking. Check back later!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <motion.div 
                                key={product._id}
                                whileHover={{ y: -5 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all flex flex-col group"
                            >
                                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                    <img 
                                        src={product.image} 
                                        alt={product.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 font-bold text-orange-600 shadow-sm border border-orange-100">
                                        ₦{product.price.toLocaleString()}
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{product.title}</h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                                        {product.description}
                                    </p>
                                    <button className="w-full py-2.5 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white rounded-xl font-medium transition flex items-center justify-center gap-2 group/btn">
                                        <ShoppingCart className="w-4 h-4" />
                                        Add to Cart
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

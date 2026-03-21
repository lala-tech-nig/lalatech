'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/projects", label: "Projects" },
        { href: "/career", label: "Careers" },
        { href: "/news", label: "News" },
        { href: "/tools", label: "Tools" },
        { href: "/course", label: "Courses" },
        { href: "/shop", label: "Shop" },
        { href: "/feed", label: "Feed" },
    ];

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md px-6 py-3 md:py-4 transition-all border-b border-slate-100 shadow-sm">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2 md:gap-3 z-50">
                    <div className="relative w-10 h-10 md:w-12 md:h-12">
                        <Image src="/bglogo.png" alt="Lala Tech Logo" fill className="object-contain" />
                    </div>
                    <span className="text-lg md:text-xl font-black text-slate-900 tracking-wide uppercase">LALA TECH</span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex gap-8 items-center font-bold text-slate-600 text-sm">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className={`hover:text-[#f89e35] transition-colors ${pathname === link.href ? 'text-[#f89e35]' : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link href="/#contact" className="bg-[#f89e35] hover:bg-[#e08b2c] text-white px-8 py-3 rounded-full font-black text-sm transition shadow-lg shadow-[#f89e35]/20">
                        Get in Touch
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden z-50 p-2 text-slate-900 focus:outline-none"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                </button>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm md:hidden"
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed top-0 right-0 h-full w-[85%] bg-white shadow-2xl p-10 pt-32 md:hidden flex flex-col items-center text-center gap-8"
                            >
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className={`text-3xl font-black transition-colors ${pathname === link.href ? 'text-[#f89e35]' : 'text-slate-900 hover:text-[#f89e35]'}`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <Link
                                    href="/#contact"
                                    className="mt-4 w-full bg-[#f89e35] text-white px-8 py-5 rounded-3xl font-black text-center text-xl shadow-xl shadow-[#f89e35]/20"
                                >
                                    Get in Touch
                                </Link>

                                <div className="mt-auto w-full py-10 border-t border-slate-100 italic font-medium text-slate-400 text-sm">
                                    Quality engineering for the modern world.
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}

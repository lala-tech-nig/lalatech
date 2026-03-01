'use client';
import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 bg-[#110f0e]/80 backdrop-blur-md px-6 py-6 transition-all">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo matching the image context */}
                <Link href="/" className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#f89e35] flex items-center justify-center">
                        <span className="w-3 h-3 rounded-full bg-white/30"></span>
                    </span>
                    <span className="text-xl font-bold text-white tracking-wide uppercase">LALA TECH</span>
                </Link>

                {/* Center links */}
                <div className="hidden md:flex gap-8 items-center font-medium text-slate-300 text-sm">
                    <Link href="/about" className="hover:text-white transition">About</Link>
                    <Link href="/projects" className="hover:text-white transition">Ventures</Link>
                    <Link href="/career" className="hover:text-white transition">Impact</Link>
                    <Link href="/career" className="hover:text-white transition">Careers</Link>
                </div>

                {/* Right Button */}
                <div className="hidden md:block">
                    <Link href="/contact" className="bg-[#f89e35] hover:bg-[#e08b2c] text-slate-950 px-6 py-2.5 rounded-full font-bold text-sm transition">
                        Get in Touch
                    </Link>
                </div>
            </div>
        </nav>
    );
}

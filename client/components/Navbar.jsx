'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md px-6 py-6 transition-all border-b border-slate-100 shadow-sm">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo matching the image context */}
                <Link href="/" className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#f89e35] flex items-center justify-center">
                        <span className="w-3 h-3 rounded-full bg-white"></span>
                    </span>
                    <span className="text-xl font-black text-slate-900 tracking-wide uppercase">LALA TECH</span>
                </Link>

                {/* Center links */}
                <div className="hidden md:flex gap-8 items-center font-medium text-slate-600 text-sm">
                    <Link href="/#about" className="hover:text-[#f89e35] transition">About</Link>
                    <Link href="/#projects" className="hover:text-[#f89e35] transition">Ventures</Link>
                    <Link href="/career" className={`hover:text-[#f89e35] transition ${pathname === '/career' ? 'text-[#f89e35]' : ''}`}>Impact</Link>
                    <Link href="/career" className={`hover:text-[#f89e35] transition ${pathname === '/career' ? 'text-[#f89e35]' : ''}`}>Careers</Link>
                </div>

                {/* Right Button */}
                <div className="hidden md:block">
                    <Link href="/#contact" className="bg-[#f89e35] hover:bg-[#e08b2c] text-white px-6 py-2.5 rounded-full font-bold text-sm transition shadow-md shadow-[#f89e35]/20">
                        Get in Touch
                    </Link>
                </div>
            </div>
        </nav>
    );
}

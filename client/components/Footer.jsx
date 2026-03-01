'use client';
import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-[#0a0908] pt-20 pb-10 relative z-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
                <div>
                    <Link href="/" className="flex items-center gap-3 mb-6">
                        <span className="w-6 h-6 rounded-full bg-[#f89e35] flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-white/30"></span>
                        </span>
                        <span className="text-xl font-bold text-white tracking-wide uppercase">LALA TECH</span>
                    </Link>
                    <p className="text-slate-500 leading-relaxed font-light text-sm max-w-sm">
                        We are a holding company dedicated to empowering the next generation of African innovation. From fintech to logistics, we build the infrastructure for the future.
                    </p>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-white tracking-widest uppercase mb-6">Quick Links</h4>
                    <ul className="space-y-4 text-slate-400 text-sm font-light">
                        <li><Link href="/about" className="hover:text-[#f89e35] transition">About Us</Link></li>
                        <li><Link href="/projects" className="hover:text-[#f89e35] transition">Ventures</Link></li>
                        <li><Link href="/career" className="hover:text-[#f89e35] transition">Careers</Link></li>
                        <li><Link href="/contact" className="hover:text-[#f89e35] transition">Contact</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-white tracking-widest uppercase mb-6">Connect</h4>
                    <ul className="space-y-4 text-slate-400 text-sm font-light">
                        <li className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-[#f89e35]" />
                            <span>+234 800 000 0000</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-[#f89e35]" />
                            <span>hello@lalatech.com</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-[#f89e35]" />
                            <span>Lagos, Nigeria</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 flex justify-between items-center text-slate-600 text-xs font-light tracking-wide">
                <p>© {new Date().getFullYear()} Lala Tech. All rights reserved.</p>
                <div className="flex gap-4">
                    <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
                    <Link href="#" className="hover:text-white transition">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
}

'use client';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-3 mb-6">
                            <span className="w-8 h-8 rounded-full bg-[#f89e35] flex items-center justify-center">
                                <span className="w-3 h-3 rounded-full bg-slate-50"></span>
                            </span>
                            <span className="text-xl font-black text-slate-900 tracking-wide uppercase">LALA TECH</span>
                        </Link>
                        <p className="text-slate-600 font-medium leading-relaxed max-w-md">
                            Your one stop shop for all tech solutions. We customize services designed to help businesses scale from SME to big organizations.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-slate-900 font-bold mb-6">Quick Links</h4>
                        <ul className="space-y-4 text-slate-600 font-medium">
                            <li><Link href="/#about" className="hover:text-[#f89e35] transition">About Us</Link></li>
                            <li><Link href="/projects" className="hover:text-[#f89e35] transition">Our Ventures</Link></li>
                            <li><Link href="/career" className="hover:text-[#f89e35] transition">Careers</Link></li>
                            <li><Link href="/#contact" className="hover:text-[#f89e35] transition">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-slate-900 font-bold mb-6">Contact</h4>
                        <ul className="space-y-4 text-slate-600 font-medium">
                            <li>hello@lalatech.com</li>
                            <li>+234 800 000 0000</li>
                            <li>Lagos, Nigeria</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm font-medium">
                        &copy; {new Date().getFullYear()} Lala Tech. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-slate-500 font-medium text-sm">
                        <Link href="#" className="hover:text-[#f89e35] transition">Privacy Policy</Link>
                        <Link href="#" className="hover:text-[#f89e35] transition">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

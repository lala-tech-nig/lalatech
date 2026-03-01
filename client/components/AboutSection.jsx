'use client';
import Image from 'next/image';

export default function AboutSection({ content }) {
    const defaultText = "We are an innovative team of developers, designers, and strategists. We build websites, mobile applications, digital marketing and management systems, hotel management softwares, POS softwares, IOT softwares. We turn ideas into wonderful software solutions to guarantee your success in the digital age.";
    const displayContent = content || defaultText;

    return (
        <section className="py-24 relative overflow-hidden bg-white" id="about">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

                <div className="relative">
                    {/* Light glowing container with actual Logo instead of spinning effect */}
                    <div className="aspect-square rounded-3xl overflow-hidden glass p-4 shadow-[0_0_50px_rgba(248,158,53,0.1)] border border-[#f89e35]/20 bg-slate-50 relative flex items-center justify-center">

                        <div className="absolute inset-0 bg-[#f89e35]/5 rounded-2xl"></div>

                        <div className="relative w-3/4 h-3/4 animate-blob">
                            <Image
                                src="/lalatechlogo.png"
                                alt="Lala Tech Logo"
                                fill
                                className="object-contain drop-shadow-2xl"
                                priority
                            />
                        </div>

                    </div>
                </div>

                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-slate-500 font-bold text-xs tracking-widest uppercase mb-6 bg-slate-50 shadow-sm">
                        Mission
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900 tracking-tight">Who <span className="text-[#f89e35]">We Are</span></h2>
                    <p className="text-lg text-slate-600 leading-relaxed mb-8 font-medium">
                        {displayContent}
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md hover:bg-white">
                            <h4 className="text-4xl font-black text-[#f89e35] mb-2 tracking-tighter">50+</h4>
                            <p className="text-slate-600 text-sm font-bold">Projects Delivered</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md hover:bg-white">
                            <h4 className="text-4xl font-black text-[#f89e35] mb-2 tracking-tighter">100%</h4>
                            <p className="text-slate-600 text-sm font-bold">Client Satisfaction</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

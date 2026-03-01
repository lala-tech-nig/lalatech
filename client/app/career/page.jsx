'use client';

export default function CareerPage() {
    return (
        <div className="pt-32 pb-24 min-h-screen relative overflow-hidden bg-[#110f0e]">

            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#f89e35]/10 rounded-full blur-[100px]"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-slate-400 text-xs tracking-widest uppercase mb-8 bg-white/5 transition-all duration-500">
                    Careers
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-white leading-tight transition-all duration-500">
                    Join <span className="text-[#f89e35]">Our Team</span>
                </h1>

                <p className="text-xl text-slate-400 mb-16 font-light leading-relaxed max-w-2xl mx-auto transition-all duration-500 delay-100">
                    We are always looking for talented individuals who share our passion for creating wonderful software solutions. Build the future with Lala Tech.
                </p>

                <div className="bg-white/5 p-12 text-center rounded-3xl border border-white/10 backdrop-blur-sm shadow-2xl transition-all duration-700">
                    <div className="w-20 h-20 bg-[#f89e35]/10 border border-[#f89e35]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">🚀</span>
                    </div>
                    <h3 className="text-2xl font-semibold mb-4 text-white tracking-tight">No Open Roles</h3>
                    <p className="text-slate-400 mb-10 leading-relaxed max-w-lg mx-auto font-light">
                        Currently, we don't have any open positions. However, we're always eager to meet driven professionals. Send us your resume and we'll keep you in mind for future opportunities.
                    </p>
                    <a href="mailto:careers@lalatech.com" className="inline-block bg-[#f89e35] hover:bg-[#e08b2c] text-[#110f0e] px-10 py-4 rounded-full font-bold transition shadow-[0_0_20px_rgba(248,158,53,0.3)]">
                        Send Resume
                    </a>
                </div>
            </div>
        </div>
    );
}

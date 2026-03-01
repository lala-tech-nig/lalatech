'use client';

export default function CareerPage() {
    return (
        <div className="pt-32 pb-24 min-h-screen relative overflow-hidden bg-white">

            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#f89e35]/15 rounded-full blur-[120px]"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-slate-500 font-bold text-xs tracking-widest uppercase mb-8 bg-slate-50 shadow-sm transition-all duration-500">
                    Careers
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight text-slate-900 leading-tight transition-all duration-500">
                    Join <span className="text-[#f89e35]">Our Team</span>
                </h1>

                <p className="text-xl text-slate-600 mb-16 font-medium leading-relaxed max-w-2xl mx-auto transition-all duration-500 delay-100">
                    We are always looking for talented individuals who share our passion for creating wonderful software solutions. Build the future with Lala Tech.
                </p>

                <div className="bg-slate-50 p-12 text-center rounded-3xl border border-slate-200 shadow-xl transition-all duration-700">
                    <div className="w-20 h-20 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">🚀</span>
                    </div>
                    <h3 className="text-2xl font-black mb-4 text-slate-900 tracking-tight">No Open Roles</h3>
                    <p className="text-slate-600 mb-10 leading-relaxed max-w-lg mx-auto font-medium">
                        Currently, we don't have any open positions. However, we're always eager to meet driven professionals. Send us your resume and we'll keep you in mind for future opportunities.
                    </p>
                    <a href="mailto:careers@lalatech.com" className="inline-block bg-[#f89e35] hover:bg-[#e08b2c] text-white px-10 py-4 rounded-full font-bold transition shadow-md shadow-[#f89e35]/20">
                        Send Resume
                    </a>
                </div>
            </div>
        </div>
    );
}

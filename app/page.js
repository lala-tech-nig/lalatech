import React from 'react';
import { Twitter, Linkedin, ArrowRight, Wallet, Truck, Tractor, Leaf } from 'lucide-react';

const LalaTechLanding = () => {
  return (
    <div className="min-h-screen bg-[#120d08] text-white font-sans selection:bg-orange-500/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full opacity-20 animate-pulse"></div>
          </div>
          <span className="font-bold text-xl tracking-tight">LALA TECH</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#" className="hover:text-white transition-colors">About</a>
          <a href="#" className="hover:text-white transition-colors">Ventures</a>
          <a href="#" className="hover:text-white transition-colors">Impact</a>
          <a href="#" className="hover:text-white transition-colors">Careers</a>
        </div>

        <button className="bg-[#f3a833] hover:bg-orange-400 text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-orange-500/10">
          Get in Touch
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
        {/* Radial Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/5 px-4 py-1 rounded-full mb-8">
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400">
            Powering African Innovation
          </span>
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold max-w-5xl leading-[1.1] mb-6">
          Building Technology That <br />
          <span className="text-[#f3a833]">Solves Real African Problems</span>
        </h1>

        <p className="text-gray-400 max-w-2xl text-lg leading-relaxed mb-10">
          We are a holding company dedicated to empowering the next generation of 
          African innovation. From fintech to logistics, we build the infrastructure 
          for the future.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button className="bg-[#f3a833] hover:bg-orange-400 text-black px-8 py-4 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105">
            Explore Our Solutions <ArrowRight size={18} />
          </button>
          <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-10 py-4 rounded-full font-bold transition-colors">
            Partner With Us
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-24 animate-bounce text-gray-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </main>

      {/* Strategic Verticals */}
      <section className="bg-black/20 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-center text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500 mb-16">
            Our Strategic Verticals
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { icon: <Wallet size={24} />, name: 'Fintech' },
              { icon: <Truck size={24} />, name: 'Logistics' },
              { icon: <Tractor size={24} />, name: 'AgriTech' },
              { icon: <Leaf size={24} />, name: 'Clean Energy' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center group cursor-pointer">
                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-all border border-white/5">
                  {item.icon}
                </div>
                <span className="text-sm font-bold tracking-wide">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 md:px-12 border-t border-white/5 flex flex-col md:row items-center justify-between gap-8">
        <div className="flex items-center gap-2 opacity-80">
          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full opacity-40"></div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">LALA TECH © 2024</span>
        </div>

        <div className="flex gap-8 text-xs font-medium text-gray-500">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>

        <div className="flex gap-4">
          <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-orange-500/20 hover:text-orange-400 transition-all">
            <Twitter size={18} />
          </a>
          <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-orange-500/20 hover:text-orange-400 transition-all">
            <Linkedin size={18} />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LalaTechLanding;
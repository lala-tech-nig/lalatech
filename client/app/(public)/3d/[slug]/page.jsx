import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Eye, Clock, Box, Share2, Calendar } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import NestedComments from './NestedComments';

async function getThreeDPost(slug) {
    try {
        const res = await fetch(`${API_BASE_URL}/3d/${slug}`, { cache: 'no-store' });
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error('Failed to fetch 3D model data');
        }
        return res.json();
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const post = await getThreeDPost(slug);
    if (!post) return { title: 'Not Found' };
    return {
        title: `${post.title} - Lala Tech 3D Showcase`,
        description: post.story.slice(0, 150).replace(/<[^>]+>/g, '') + '...',
    };
}

export default async function ThreeDPostPage({ params }) {
    const { slug } = await params;
    const post = await getThreeDPost(slug);
    if (!post) notFound();

    // Extract Sketchfab Model ID from regular URL to construct embed URL
    // e.g. https://sketchfab.com/3d-models/opportunity-0eef63b33e774be6b2ddec9e2e86e2f8
    const idMatch = post.sketchfabUrl.match(/-([a-zA-Z0-9]{32})$/);
    const fallbackIdMatch = post.sketchfabUrl.match(/\/([a-zA-Z0-9]{32})(?:$|\?)/); 
    const modelId = idMatch ? idMatch[1] : (fallbackIdMatch ? fallbackIdMatch[1] : '');
    
    const embedUrl = modelId 
        ? `https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_controls=1&ui_infos=1&ui_inspector=1&ui_stop=1&ui_watermark=0&ui_watermark_link=0`
        : ''; // Fallback just in case

    return (
        <div className="bg-slate-50 min-h-screen pt-24 pb-20">
            {/* Header */}
            <div className="max-w-5xl mx-auto px-6 lg:px-8 pt-8">
                <Link href="/3d" className="inline-flex items-center text-[#f89e35] font-bold hover:text-[#e08b2c] transition group mb-10 text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition" />
                    Back to Showcase
                </Link>

                <div className="mb-10 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/50 text-slate-500 font-black text-[10px] tracking-widest uppercase mb-4">
                        <Box className="w-3 h-3 text-[#f89e35]" /> Interactive 3D Model
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
                        {post.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8 text-slate-500 font-bold text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#f89e35] text-white flex items-center justify-center">LT</div>
                            <span className="text-slate-900">{post.author || 'Lala Tech'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#f89e35]" />
                            {new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year:'numeric' })}
                        </div>
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-[#f89e35]" />
                            {post.views} Views
                        </div>
                        <button className="flex items-center gap-2 hover:text-[#f89e35] transition ml-auto border border-slate-200 bg-white px-4 py-2 rounded-full shadow-sm">
                            <Share2 className="w-4 h-4" /> Share
                        </button>
                    </div>
                </div>
            </div>

            {/* Embedded 3D Viewer */}
            <div className="w-full bg-[#110f0e] border-y border-slate-800 shadow-2xl z-10 relative">
                <div className="max-w-[1400px] mx-auto w-full aspect-video md:aspect-[21/9] bg-slate-900 relative">
                    {!embedUrl ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 space-y-4">
                            <Box className="w-16 h-16 opacity-50" />
                            <p className="font-bold tracking-widest uppercase">Invalid Sketchfab URL Format</p>
                            <a href={post.sketchfabUrl} target="_blank" rel="noopener noreferrer" className="text-[#f89e35] underline text-sm">View Original Link</a>
                        </div>
                    ) : (
                        <iframe 
                            title={post.title} 
                            frameBorder="0" 
                            allowFullScreen 
                            mozallowfullscreen="true" 
                            webkitallowfullscreen="true" 
                            allow="autoplay; fullscreen; xr-spatial-tracking" 
                            xr-spatial-tracking="true"
                            execution-while-out-of-viewport="true" 
                            execution-while-not-rendered="true" 
                            web-share="true" 
                            className="w-full h-full absolute inset-0"
                            src={embedUrl}
                        />
                    )}
                </div>
            </div>

            {/* Attribution */}
            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 mt-4 flex justify-end">
                <a href={post.sketchfabUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-400 hover:text-[#f89e35] transition inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    View original model on Sketchfab <span className="text-[#f89e35]">&rarr;</span>
                </a>
            </div>

            {/* Content & Comments Body */}
            <div className="max-w-4xl mx-auto px-6 lg:px-8 mt-16 md:mt-20">
                
                {/* Visual Separator */}
                <div className="flex items-center gap-4 mb-16">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">
                        The Story Behind The Model
                    </div>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                {/* Narrative */}
                <div className="bg-white p-8 md:p-14 rounded-[3rem] shadow-sm border border-slate-200/50 mb-20 prose prose-lg prose-slate max-w-none break-words overflow-hidden w-full">
                    <div dangerouslySetInnerHTML={{ __html: post.story }} className="w-full [&>p]:break-words [&>img]:max-w-full [&>img]:h-auto [&>iframe]:max-w-full [&>div]:max-w-full" />
                </div>

                {/* Discussion Area */}
                <div className="bg-white p-8 md:p-14 rounded-[3rem] shadow-sm border border-slate-200/50">
                    <div className="mb-10">
                        <h3 className="text-3xl font-black text-slate-900 mb-2">Community Discussion</h3>
                        <p className="text-slate-500 font-medium text-lg">Share your thoughts or ask questions about this model.</p>
                    </div>
                    
                    {/* The Recursive Comments Component */}
                    <NestedComments postId={post.slug} postType="threed" />
                </div>

            </div>
        </div>
    );
}

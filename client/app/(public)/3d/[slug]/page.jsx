import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Eye, Clock, Box, Share2, Calendar } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import NestedComments from './NestedComments';
import ThreeDViewer from './ThreeDViewer';

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
    
    // Check if URL is already an embed URL to prevent invalid formatting
    const isEmbed = post.sketchfabUrl.includes('/embed');
    const embedUrl = isEmbed 
        ? post.sketchfabUrl 
        : (modelId 
            ? `https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_controls=1&ui_infos=1&ui_inspector=1&ui_stop=1&ui_watermark=0&ui_watermark_link=0`
            : null);

    return (
        <div className="bg-slate-50 min-h-screen pt-24 pb-20 selection:bg-[#f89e35] selection:text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-8">
                {/* Back Button */}
                <Link href="/3d" className="inline-flex items-center text-[#f89e35] font-black hover:text-slate-900 transition-colors group mb-10 text-xs tracking-widest uppercase bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200">
                    <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Showcase
                </Link>

                {/* Header Info (Moved to top) */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-slate-900 font-black text-[10px] tracking-widest uppercase mb-6">
                        <Box className="w-3.5 h-3.5 text-[#f89e35]" /> Interactive 3D Model
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
                        {post.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold text-sm bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md border-2 border-slate-100 font-black tracking-tighter text-xs">LT</div>
                            <span className="text-slate-900 uppercase tracking-widest text-[10px]">{post.author || 'Lala Tech'}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year:'numeric' })}
                        </div>
                        <button className="flex items-center gap-2 hover:bg-slate-100 transition ml-auto bg-slate-50 px-4 py-2 rounded-full border border-slate-200 text-slate-900">
                            <Share2 className="w-4 h-4" /> <span className="text-[10px] uppercase tracking-widest font-black">Share</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                    {/* LEFT COLUMN: 3D Model Viewer */}
                    <div className="w-full lg:w-[55%] flex flex-col">
                        <div className="sticky top-28">
                            {embedUrl ? (
                                <ThreeDViewer embedUrl={embedUrl} title={post.title} />
                            ) : (
                                <div className="w-full aspect-square bg-[#110f0e] rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-white/50 space-y-4">
                                    <Box className="w-16 h-16 opacity-50" />
                                    <p className="font-bold tracking-widest uppercase text-xs">Invalid Sketchfab URL Format</p>
                                    <a href={post.sketchfabUrl} target="_blank" rel="noopener noreferrer" className="text-[#f89e35] hover:text-white transition-colors underline text-sm font-medium">View Original Link</a>
                                </div>
                            )}

                            {/* Attribution */}
                            <div className="mt-6 flex justify-between items-center px-2">
                                <div className="flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-[#f89e35]" /> {post.views} Views</span>
                                </div>
                                <a href={post.sketchfabUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm hover:shadow-md">
                                    Original on Sketchfab <span className="text-[#f89e35] bg-[#f89e35]/10 w-6 h-6 rounded-full flex items-center justify-center font-bold">&rarr;</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Narration & Content */}
                    <div className="w-full lg:w-[45%] flex flex-col">

                        {/* Narrative Container */}
                        <div className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 mb-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f89e35]/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                            
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-4">
                                <span className="w-8 h-px bg-slate-200"></span> The Story <span className="w-full h-px bg-slate-200 flex-1"></span>
                            </h3>

                            <div className="prose prose-lg prose-slate prose-headings:font-black prose-a:text-[#f89e35] prose-a:no-underline hover:prose-a:underline prose-img:rounded-3xl prose-img:shadow-lg max-w-none break-words w-full">
                                <div dangerouslySetInnerHTML={{ __html: post.story }} className="w-full [&>p]:break-words [&>img]:max-w-full [&>img]:h-auto [&>iframe]:max-w-full [&>div]:max-w-full text-slate-600 leading-relaxed" />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Discussion Area */}
                <div className="mt-16 sm:mt-24 max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-200/60">
                    <div className="mb-10 text-center sm:text-left">
                        <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Community Discussion</h3>
                        <p className="text-slate-500 font-medium">Share your thoughts or ask questions about this model.</p>
                    </div>
                    
                    {/* The Recursive Comments Component */}
                    <NestedComments postId={post.slug} postType="threed" />
                </div>
            </div>
        </div>
    );
}

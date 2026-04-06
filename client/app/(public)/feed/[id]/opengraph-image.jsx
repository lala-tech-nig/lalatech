import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Lala Tech Feed Post';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
    const { id } = params;
    let post = null;

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/posts/${id}`, { next: { revalidate: 60 } });
        if (res.ok) post = await res.json();
    } catch {}

    const content = post?.content || 'Check out this post from Lala Tech!';
    const preview = content.length > 220 ? content.substring(0, 220) + '...' : content;
    const dateStr = post?.createdAt
        ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Lala Tech';

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Decorative glows */}
                <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'rgba(248,158,53,0.12)', display: 'flex' }} />
                <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(248,158,53,0.07)', display: 'flex' }} />

                {/* Top bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '36px 56px 0', position: 'relative', zIndex: 1 }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'linear-gradient(135deg, #f89e35, #f56e00)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 900, fontSize: 22, color: 'white',
                        }}>L</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 900, fontSize: 22, color: 'white', letterSpacing: '-0.5px' }}>LALA TECH</span>
                            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>@lalatech</span>
                        </div>
                    </div>
                    {/* Badge */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        background: 'rgba(248,158,53,0.15)',
                        border: '1px solid rgba(248,158,53,0.35)',
                        color: '#f89e35', fontSize: 12, fontWeight: 800,
                        letterSpacing: '2px', textTransform: 'uppercase',
                        padding: '8px 18px', borderRadius: 100,
                    }}>
                        ⚡ Live Feed
                    </div>
                </div>

                {/* Main content card */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    padding: '28px 56px', position: 'relative', zIndex: 1,
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 24,
                        padding: '36px 44px',
                        backdropFilter: 'blur(10px)',
                    }}>
                        {/* Quote mark */}
                        <div style={{ fontSize: 72, color: '#f89e35', lineHeight: 0.8, marginBottom: 10, display: 'flex', fontFamily: 'Georgia, serif' }}>"</div>
                        <div style={{
                            fontSize: preview.length > 150 ? 22 : 26,
                            color: 'white', lineHeight: 1.55, fontWeight: 500,
                            letterSpacing: '-0.2px',
                        }}>{preview}</div>
                        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 2, background: '#f89e35', borderRadius: 2 }} />
                            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{dateStr}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 56px 36px', position: 'relative', zIndex: 1,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        {post?.likes > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#ef4444', fontWeight: 700, fontSize: 14 }}>
                                ❤️ {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                            </div>
                        )}
                        {post?.shares > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#64748b', fontWeight: 700, fontSize: 14 }}>
                                🔁 {post.shares} shares
                            </div>
                        )}
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>lalatech.com/feed</div>
                </div>

                {/* Bottom gradient line */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
                    background: 'linear-gradient(90deg, #f56e00, #f89e35, #f56e00)',
                    display: 'flex',
                }} />
            </div>
        ),
        { ...size }
    );
}

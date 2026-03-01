import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import ProjectsSection from '@/components/ProjectsSection';
import ContactSection from '@/components/ContactSection';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let content = {};
  try {
    const res = await fetch('http://localhost:5000/api/content', { cache: 'no-store' });
    if (res.ok) {
      content = await res.json();
    }
  } catch (err) {
    console.error('Content fetch error', err);
  }

  return (
    <>
      <HeroSection content={content.hero} />
      <AboutSection content={content.about} />
      <ProjectsSection />
      <ContactSection />
    </>
  );
}
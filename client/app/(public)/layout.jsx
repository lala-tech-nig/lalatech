import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import VisitorTracker from "@/components/VisitorTracker";

export default function PublicLayout({ children }) {
    return (
        <>
            <VisitorTracker />
            <Navbar />
            <main className="min-h-screen">
                {children}
            </main>
            <Footer />
            <FloatingWhatsApp />
        </>
    );
}

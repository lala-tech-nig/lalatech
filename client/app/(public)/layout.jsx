import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import VisitorTracker from "@/components/VisitorTracker";
import PromotionModal from "@/components/PromotionModal";

export default function PublicLayout({ children }) {
    return (
        <>
            <VisitorTracker />
            <PromotionModal />
            <Navbar />
            <main className="min-h-screen">
                {children}
            </main>
            <Footer />
            <FloatingWhatsApp />
        </>
    );
}

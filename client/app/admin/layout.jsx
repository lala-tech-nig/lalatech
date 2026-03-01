export const metadata = {
    title: "Admin Dashboard - Lala Tech",
    description: "Secure admin management portal",
};

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            {children}
        </div>
    );
}

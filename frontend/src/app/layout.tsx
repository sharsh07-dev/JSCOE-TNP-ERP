import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TNP ERP | Training & Placement Cell Management System",
  description: "Production-ready ERP system for Training and Placement Cell - Generate professional Drive, Session, and Management Reports effortlessly.",
  keywords: "TNP, Training, Placement, ERP, Campus Drive, Report Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#f8fafc' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}

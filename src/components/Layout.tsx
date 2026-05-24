import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";
import { MobileBookBar } from "./MobileBookBar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer />
      <WhatsAppFab />
      <MobileBookBar />
    </div>
  );
}

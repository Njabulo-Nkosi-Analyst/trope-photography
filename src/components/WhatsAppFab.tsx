import { MessageCircle } from "lucide-react";

export function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/27608965498?text=Hi%2C%20I%27d%20like%20to%20book%20a%20photography%20session"
      target="_blank" rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-[0_20px_60px_-20px_rgba(232,36,26,0.6)] hover:scale-110 transition-transform"
    >
      <MessageCircle size={24} />
    </a>
  );
}

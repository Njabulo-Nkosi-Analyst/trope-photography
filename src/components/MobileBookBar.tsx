import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function MobileBookBar() {
  const { location } = useRouterState();
  // Hide on contact (already there) and on admin/auth screens
  const hidden = ["/contact", "/sign-in", "/sign-up", "/admin", "/forgot-password", "/reset-password"].some(p => location.pathname.startsWith(p));
  if (hidden) return null;
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
      <div className="text-xs">
        <div className="font-semibold">Ready to book?</div>
        <div className="text-muted-foreground">Free consult · 24h reply</div>
      </div>
      <Link to="/contact" className="btn-lime px-4 py-2.5 rounded-md text-sm inline-flex items-center gap-2 shrink-0">
        Book Now <ArrowRight size={14} />
      </Link>
    </div>
  );
}

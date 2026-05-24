import { Link } from "@tanstack/react-router";
import { Menu, X, Heart } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useFavourites } from "@/hooks/useFavourites";

const links = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { count } = useFavourites();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 lg:px-8 h-16 lg:h-20">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full grid place-items-center bg-primary text-primary-foreground font-display font-bold">◉</span>
          <span className="font-display text-xl font-bold tracking-tight">TANN <span className="text-primary">.</span></span>
        </Link>
        <nav className="hidden lg:flex items-center gap-8">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }} activeOptions={{ exact: l.to === "/" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-4">
          <Link to="/favourites" className="relative text-muted-foreground hover:text-foreground transition-colors" aria-label="Favourites">
            <Heart size={18} className={count > 0 ? "fill-primary text-primary" : ""} />
            {count > 0 && <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] min-w-[16px] h-[16px] rounded-full px-1 grid place-items-center font-bold">{count}</span>}
          </Link>
          <a href="tel:0714967968" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <span>📞</span> 071 496 7968
          </a>
          {user ? (
            <Link to={isAdmin ? "/admin" : "/dashboard"} className="text-sm text-muted-foreground hover:text-foreground">
              {isAdmin ? "Admin" : "Dashboard"}
            </Link>
          ) : (
            <Link to="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          )}
          <Link to="/contact" className="btn-lime px-4 py-2 rounded-md text-sm font-semibold">Book Session</Link>
        </div>
        <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border px-5 py-4 space-y-3 bg-background">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="block text-base" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <Link to="/favourites" onClick={() => setOpen(false)} className="block text-base inline-flex items-center gap-2">
            <Heart size={14} className={count > 0 ? "fill-primary text-primary" : ""} /> Favourites {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
          </Link>
          <div className="pt-3 border-t border-border flex items-center justify-between">
            {user
              ? <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="text-sm">{isAdmin ? "Admin" : "Dashboard"}</Link>
              : <Link to="/sign-in" onClick={() => setOpen(false)} className="text-sm">Sign in</Link>}
            <Link to="/contact" onClick={() => setOpen(false)} className="btn-lime px-4 py-2 rounded-md text-sm">Book Now</Link>
          </div>
        </div>
      )}
    </header>
  );
}

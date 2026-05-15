import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 grid gap-12 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-md grid place-items-center bg-primary text-primary-foreground font-display font-bold">G</span>
            <span className="font-display text-xl font-bold">Garlo</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            Capturing emotions and stories that make life special.
          </p>
          <div className="flex items-center gap-3 mt-6">
            {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-full bg-secondary grid place-items-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold mb-4">Pages</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/gallery" className="hover:text-foreground">Gallery</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/contact" className="hover:text-foreground">Book a session</Link></li>
            <li><Link to="/gallery" className="hover:text-foreground">Browse work</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">All packages</Link></li>
            <li><Link to="/sign-in" className="hover:text-foreground">Client portal</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold mb-4">Get in touch</h4>
          <p className="text-sm text-muted-foreground">Cape Town, South Africa</p>
          <p className="text-sm text-muted-foreground">hello@garlostudio.com</p>
          <p className="text-sm text-muted-foreground">+27 12 345 6789</p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} <span className="text-primary">Garlo</span> Studio. All rights reserved.
      </div>
    </footer>
  );
}

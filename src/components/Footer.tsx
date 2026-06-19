import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react";
import { Logo } from "@/components/TropeLogo";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 grid gap-12 lg:grid-cols-4">
        <div>
          <Link to="/" className="inline-flex mb-4">
            <Logo />
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
          <h4 className="font-display text-base mb-4 tracking-[0.08em]">PAGES</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/gallery" className="hover:text-foreground">Gallery</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/contact" search={{}} className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-base mb-4 tracking-[0.08em]">GET IN TOUCH</h4>
          <p className="text-sm text-muted-foreground">Durban, South Africa</p>
          <p className="text-sm text-muted-foreground">@tannphotography</p>
          <p className="text-sm text-muted-foreground">060 896 5498</p>
          <p className="text-sm text-muted-foreground">071 496 7968</p>
        </div>
        <div>
          <h4 className="font-display text-base mb-4 tracking-[0.08em]">BANK DETAILS</h4>
          <p className="text-sm text-muted-foreground">FNB</p>
          <p className="text-sm text-muted-foreground">W. Maluleka</p>
          <p className="text-sm text-muted-foreground">Acc No. 63052599968</p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} <span className="text-primary">TANN</span> Photography. All rights reserved.
      </div>
    </footer>
  );
}
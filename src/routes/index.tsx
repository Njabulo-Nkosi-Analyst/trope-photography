import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Star } from "lucide-react";

const CATEGORIES = [
  { name: "Weddings", img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80" },
  { name: "Portraits", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80" },
  { name: "Events", img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80" },
  { name: "Products", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80" },
  { name: "Maternity", img: "https://images.unsplash.com/photo-1519011985187-444d62641929?auto=format&fit=crop&w=800&q=80" },
  { name: "Kids", img: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80" },
  { name: "Corporate", img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80" },
];

const FEATURED = [
  "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=80",
];

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Garlo Studio — Photography that captures your story" }] }),
  component: Home,
});

function Home() {
  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => (await supabase.from("testimonials").select("*").limit(3)).data ?? [],
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-10 lg:pt-16">
        <div className="text-center max-w-4xl mx-auto">
          <span className="eyebrow">Cape Town · Worldwide</span>
          <h1 className="mt-6 font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95]">
            Capturing moments<br />
            <span className="text-gradient-warm">that last forever.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto bg-slate-50">
            Garlo Studio · Cape Town, South Africa. Wedding, portrait, event and brand photography crafted with cinematic care.
          </p>
        </div>

        {/* Category portrait grid */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {CATEGORIES.map((c, i) => (
            <Link key={c.name} to="/gallery"
              className="group relative overflow-hidden rounded-xl bg-secondary aspect-[3/4] block"
              style={{ animation: `fadeUp .6s ease ${i * 60}ms both` }}>
              <img src={c.img} alt={c.name} loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 lg:p-4">
                <div className="font-display font-bold text-sm lg:text-base">{c.name}</div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-primary mt-1">
                  View <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/contact" className="btn-lime px-6 py-3 rounded-md text-sm">Book a Session</Link>
          <Link to="/gallery" className="btn-ghost-dark px-6 py-3 rounded-md text-sm">View All Work</Link>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { n: "500+", l: "Sessions delivered" },
            { n: "5★", l: "Average client rating" },
            { n: "10+", l: "Years experience" },
          ].map(s => (
            <div key={s.l} className="panel p-8 text-center">
              <div className="font-display text-5xl font-bold text-gradient-warm">{s.n}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Work */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <span className="eyebrow">Recent Work</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold mt-3">
              A glimpse of <span className="text-gradient-warm">my craft</span>
            </h2>
          </div>
          <Link to="/gallery" className="btn-lime px-5 py-3 rounded-md text-sm whitespace-nowrap">See full gallery</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURED.map((src, i) => (
            <div key={i} className={`overflow-hidden rounded-xl bg-secondary ${i % 5 === 0 ? "aspect-[3/4] md:row-span-2 md:aspect-[3/5]" : "aspect-[3/4]"}`}>
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-24">
        <span className="eyebrow">Testimonial</span>
        <h2 className="font-display text-4xl md:text-6xl font-bold mt-3 mb-10">
          Client <span className="text-gradient-warm">Feedback</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map(t => (
            <div key={t.id} className="panel p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} className="fill-primary text-primary" />)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{t.quote}"</p>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="font-semibold text-sm">{t.client_name}</div>
                <div className="text-xs text-muted-foreground">{t.category}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 mt-24">
        <div className="panel p-10 lg:p-16 text-center">
          <h2 className="font-display text-4xl md:text-6xl font-bold">
            Ready to <span className="text-gradient-warm">create?</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Tell me about your vision — I'll get back within 24 hours.</p>
          <Link to="/contact" className="mt-8 inline-flex btn-lime px-6 py-3 rounded-md text-sm">Start your booking</Link>
        </div>
      </section>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style>
    </Layout>
  );
}

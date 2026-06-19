import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { VideoEmbed } from "@/components/VideoEmbed";
import { useFavourites } from "@/hooks/useFavourites";
import { X, Tag, Clock, ArrowRight, Heart, Image as ImageIcon, Play } from "lucide-react";

const FALLBACK = [
  { category: "Weddings", url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80" },
  { category: "Weddings", url: "https://images.unsplash.com/photo-1525772764200-be829a350797?auto=format&fit=crop&w=900&q=80" },
  { category: "Portraits", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80" },
  { category: "Portraits", url: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80" },
  { category: "Events", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80" },
  { category: "Products", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80" },
  { category: "Kids", url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80" },
  { category: "Corporate", url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80" },
];

const TABS = ["All", "Weddings", "Portraits", "Events", "Products", "Maternity", "Kids", "Corporate"];

export const Route = createFileRoute("/gallery")({
  head: () => ({ meta: [{ title: "Gallery — Trope Photography" }] }),
  component: Gallery,
});

function Countdown({ ends }: { ends: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(ends).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return (
    <div className="flex gap-3 text-center">
      {[["Days", d], ["Hrs", h], ["Min", m], ["Sec", s]].map(([l, v]) => (
        <div key={l as string} className="bg-background/40 backdrop-blur rounded-md px-3 py-1.5 min-w-[54px]">
          <div className="font-display text-xl font-bold leading-none">{String(v).padStart(2, "0")}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-80">{l}</div>
        </div>
      ))}
    </div>
  );
}

function Gallery() {
  const [tab, setTab] = useState("All");
  const [mode, setMode] = useState<"photos" | "video">("photos");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { isFav, toggle, count } = useFavourites();

  const { data: images = FALLBACK } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data } = await supabase.from("gallery_images").select("*").order("sort_order");
      return data && data.length > 0 ? data : FALLBACK;
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["packages-with-video"],
    queryFn: async () => (await supabase.from("packages").select("category,name,video_url,cover_image_url").eq("is_active", true)).data ?? [],
  });

  const { data: promo } = useQuery({
    queryKey: ["active-promo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .gt("ends_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const filtered = tab === "All" ? images : images.filter(i => i.category === tab);

  const videos = useMemo(() => {
    const list = packages.filter(p => p.video_url) as { category: string; name: string; video_url: string; cover_image_url: string | null }[];
    return tab === "All" ? list : list.filter(v => v.category === tab || v.category === tab.replace(/s$/, ""));
  }, [packages, tab]);

  useEffect(() => { if (mode === "video" && videos.length === 0) setMode("photos"); }, [videos.length, mode]);

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20">
        {promo && (
          <div className="mb-10 panel p-6 lg:p-8 border-primary bg-gradient-to-br from-primary/15 via-background to-background relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-wrap items-center gap-6 justify-between">
              <div className="flex items-start gap-4">
                <span className="w-12 h-12 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0"><Tag size={20} /></span>
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
                    <Clock size={12} /> Limited time
                    {promo.discount_label && <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded-full">{promo.discount_label}</span>}
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold mt-1">{promo.title}</h2>
                  {promo.description && <p className="text-sm text-muted-foreground mt-1 max-w-xl">{promo.description}</p>}
                  <div className="text-xs text-muted-foreground mt-2">Ends {new Date(promo.ends_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Countdown ends={promo.ends_at} />
                <Link to="/contact" search={{ category: undefined, package: undefined }} className="btn-lime px-5 py-2.5 rounded-md text-sm inline-flex items-center gap-2">
                  Claim offer <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="eyebrow">Gallery</span>
            <h1 className="font-display text-5xl md:text-7xl font-bold mt-3">
              Browse my <span className="text-gradient-warm">work</span>
            </h1>
          </div>
          <Link to="/favourites" className="panel px-4 py-2.5 rounded-full text-sm inline-flex items-center gap-2 hover:border-primary transition-colors">
            <Heart size={14} className={count > 0 ? "fill-primary text-primary" : ""} />
            Favourites {count > 0 && <span className="bg-primary text-primary-foreground rounded-full text-[10px] min-w-[18px] h-[18px] px-1 grid place-items-center font-bold">{count}</span>}
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
          <Link
            to="/contact"
            search={tab === "All" ? { category: undefined, package: undefined } : { category: tab.replace(/s$/, ""), package: undefined } as any}
            className="btn-lime px-5 py-2.5 rounded-full text-sm whitespace-nowrap inline-flex items-center gap-2"
          >
            Book {tab === "All" ? "a session" : tab.toLowerCase()} <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-6 inline-flex p-1 bg-secondary rounded-full">
          <button onClick={() => setMode("photos")}
            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all ${mode === "photos" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}>
            <ImageIcon size={12} /> Photos
          </button>
          <button onClick={() => setMode("video")} disabled={videos.length === 0}
            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${mode === "video" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}>
            <Play size={12} /> Video {videos.length > 0 && <span className="opacity-70">({videos.length})</span>}
          </button>
        </div>

        {mode === "photos" ? (
          <div className="mt-8 columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
            {filtered.map((img, i) => {
              const fav = isFav(img.url);
              return (
                <div key={i} className="mb-3 break-inside-avoid relative group rounded-xl overflow-hidden bg-secondary">
                  <button onClick={() => setLightbox(img.url)} className="block w-full">
                    <img src={img.url} alt={img.category} loading="lazy"
                      className="w-full hover:scale-105 transition-transform duration-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle({ url: img.url, category: img.category, caption: (img as any).caption ?? null }); }}
                    aria-label={fav ? "Remove from favourites" : "Save to favourites"}
                    className={`absolute top-2 right-2 w-9 h-9 rounded-full grid place-items-center backdrop-blur transition-all ${fav ? "bg-primary text-primary-foreground" : "bg-background/70 text-foreground opacity-0 group-hover:opacity-100"}`}>
                    <Heart size={16} className={fav ? "fill-current" : ""} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {videos.map((v, i) => (
              <div key={i} className="panel overflow-hidden">
                <div className="aspect-video bg-black">
                  <VideoEmbed url={v.video_url} title={v.name} className="w-full h-full" />
                </div>
                <div className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{v.category}</div>
                    <div className="font-display text-lg font-bold">{v.name}</div>
                  </div>
                  <Link to="/contact" search={{ category: v.category, package: v.name } as any}
                    className="btn-lime px-4 py-2 rounded-md text-xs inline-flex items-center gap-1.5">
                    Book this <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
            {videos.length === 0 && (
              <div className="md:col-span-2 panel p-10 text-center text-muted-foreground text-sm">
                No videos uploaded for this category yet.
              </div>
            )}
          </div>
        )}

        <div className="mt-12 panel p-8 text-center">
          <h3 className="font-display text-2xl md:text-3xl font-bold">Like what you see?</h3>
          <p className="text-sm text-muted-foreground mt-2">Book your {tab === "All" ? "session" : tab.toLowerCase() + " session"} today — limited slots each month.</p>
          <Link
            to="/contact"
            search={tab === "All" ? { category: undefined, package: undefined } : { category: tab.replace(/s$/, ""), package: undefined } as any}
            className="mt-5 inline-flex btn-lime px-6 py-3 rounded-md text-sm items-center gap-2"
          >
            Book now <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 grid place-items-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-6 text-white" onClick={() => setLightbox(null)}><X size={28} /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </Layout>
  );
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { VideoEmbed } from "@/components/VideoEmbed";
import { useFavourites } from "@/hooks/useFavourites";
import { X, Tag, Clock, ArrowRight, Heart, Image as ImageIcon, Play, AlertCircle, Check } from "lucide-react";

const isVideoUrl = (url: string) => /\.(mp4|mov|webm)(\?|$)/i.test(url);

export const Route = createFileRoute("/gallery")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : undefined,
    package: typeof s.package === "string" ? s.package : undefined,
    promo: s.promo === true || s.promo === "true" ? true : undefined,
  }),
  head: () => ({ meta: [{ title: "Gallery — Tann Media" }] }),
  component: Gallery,
});

function Countdown({ ends }: { ends: string }) {
  const endMs = useMemo(() => new Date(ends).getTime(), [ends]);
  const [diff, setDiff] = useState(() => Math.max(0, endMs - Date.now()));
  useEffect(() => {
    const id = setInterval(() => { const r = Math.max(0, endMs - Date.now()); setDiff(r); if (r === 0) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [endMs]);
  if (diff === 0) return <div className="flex items-center gap-2 text-destructive text-sm font-semibold"><AlertCircle size={16}/> Offer ended</div>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return (
    <div className="flex gap-2 text-center">
      {([["Days",d],["Hrs",h],["Min",m],["Sec",s]] as [string,number][]).map(([l,v]) => (
        <div key={l} className="bg-background/40 backdrop-blur rounded-md px-3 py-1.5 min-w-[52px]">
          <div className="font-display text-xl font-bold leading-none tabular-nums">{String(v).padStart(2,"0")}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-80 mt-0.5">{l}</div>
        </div>
      ))}
    </div>
  );
}

function Gallery() {
  const { category: urlCategory } = Route.useSearch();
  const [tab, setTab] = useState(urlCategory ?? "All");
  const [mode, setMode] = useState<"photos"|"video">("photos");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { isFav, toggle, count } = useFavourites();
  const navigate = useNavigate();

  const { data: allMedia = [] } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => (await supabase.from("gallery_images").select("*").order("sort_order")).data ?? [],
  });

  const { data: packageVideos = [] } = useQuery({
    queryKey: ["packages-with-video"],
    queryFn: async () =>
      (await supabase.from("packages").select("category, name, video_url, cover_image_url")
        .eq("is_active", true).not("video_url", "is", null)).data ?? [],
  });

  const { data: promo } = useQuery({
    queryKey: ["active-promo"],
    queryFn: async () => {
      const { data } = await supabase.from("promotions").select("*").eq("is_active", true)
        .gt("ends_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const { data: promoPackage } = useQuery({
    queryKey: ["promo-package", promo?.package_id, promo?.package_name, promo?.package_category],
    enabled: !!(promo?.package_id || promo?.package_name),
    queryFn: async () => {
      if (promo?.package_id) {
        const { data } = await supabase.from("packages").select("*").eq("id", promo.package_id).eq("is_active", true).maybeSingle();
        if (data) return data;
      }
      let q = supabase.from("packages").select("*").ilike("name", promo!.package_name).eq("is_active", true);
      if (promo?.package_category) q = q.ilike("category", promo.package_category);
      const { data } = await q.maybeSingle();
      return data;
    },
  });

  const galleryPhotos = useMemo(() => allMedia.filter((i: any) => i.media_type !== "video" && !isVideoUrl(i.url)), [allMedia]);
  const galleryVideos = useMemo(() => allMedia.filter((i: any) => i.media_type === "video" || isVideoUrl(i.url)), [allMedia]);

  const TABS = useMemo(() => {
    const cats = Array.from(new Set(allMedia.map((i: any) => i.category))).filter(Boolean).sort();
    return ["All", ...cats] as string[];
  }, [allMedia]);

  useEffect(() => { if (tab !== "All" && !TABS.includes(tab)) setTab("All"); }, [TABS, tab]);
  useEffect(() => { if (urlCategory) setTab(urlCategory); }, [urlCategory]);

  const filteredPhotos = tab === "All" ? galleryPhotos : galleryPhotos.filter((i: any) => i.category === tab);
  const filteredVideos = useMemo(() => {
    const fromGallery = (tab === "All" ? galleryVideos : galleryVideos.filter((v: any) => v.category === tab))
      .map((v: any) => ({ id: v.id, name: v.caption ?? v.category, category: v.category, video_url: v.url, cover_image_url: null, source: "gallery" as const }));
    const fromPackages = packageVideos
      .filter((p: any) => p.video_url && (tab === "All" || p.category === tab))
      .map((p: any) => ({ id: p.name, name: p.name, category: p.category, video_url: p.video_url, cover_image_url: p.cover_image_url, source: "package" as const }));
    return [...fromGallery, ...fromPackages];
  }, [galleryVideos, packageVideos, tab]);

  const hasVideos = filteredVideos.length > 0;
  useEffect(() => { if (mode === "video" && !hasVideos) setMode("photos"); }, [hasVideos, mode]);

  const claimOffer = () => {
    if (!promo) return;
    navigate({
      to: "/contact",
      search: { category: promo.package_category ?? undefined, package: promo.package_name ?? undefined } as any,
      hash: "booking-form",
    });
  };

  const savings = promo?.original_price && promo?.sale_price
    ? Number(promo.original_price) - Number(promo.sale_price) : null;

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20">

        {/* Promo Banner — NO promo code field */}
        {promo && (
          <div className="mb-10 panel p-6 lg:p-8 border-primary bg-gradient-to-br from-primary/15 via-background to-background relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"/>
            <div className="relative space-y-5">
              <div className="flex flex-wrap items-start gap-6 justify-between">
                <div className="flex items-start gap-4">
                  <span className="w-12 h-12 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0"><Tag size={20}/></span>
                  <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold flex-wrap">
                      <Clock size={12}/> Limited time
                      {promo.discount_label && <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded-full">{promo.discount_label}</span>}
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold mt-1">{promo.title}</h2>
                    {promo.description && <p className="text-sm text-muted-foreground mt-1 max-w-xl">{promo.description}</p>}
                    {promo.package_name && (
                      <p className="text-xs text-primary/80 mt-2 font-medium">
                        ✦ Applies to: {promo.package_category ? `${promo.package_category} · ` : ""}{promo.package_name}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Ends {new Date(promo.ends_at).toLocaleString("en-ZA", { weekday:"short", day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Countdown ends={promo.ends_at}/>
                  <button onClick={claimOffer} className="btn-lime px-5 py-2.5 rounded-md text-sm inline-flex items-center gap-2">
                    Claim offer <ArrowRight size={14}/>
                  </button>
                </div>
              </div>

              {/* Sale package card */}
              {promoPackage && (
                <div className="pt-4 border-t border-border/50">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">On sale now</div>
                  <div className="rounded-xl border-2 border-orange-500/50 bg-orange-500/5 shadow-[0_0_30px_rgba(249,115,22,0.12)] p-5 relative overflow-hidden">
                    <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Tag size={9}/> ON SALE
                    </div>
                    <div className="pr-16">
                      <div className="font-display text-lg font-bold">{promoPackage.name}</div>
                      <div className="text-xs text-muted-foreground">{promoPackage.category} · {promoPackage.duration}</div>
                    </div>
                    <div className="mt-3 flex items-end gap-3 flex-wrap">
                      <div>
                        <div className="text-sm text-muted-foreground line-through">R{Number(promo.original_price ?? promoPackage.price).toLocaleString()}</div>
                        <div className="font-display text-3xl font-bold text-orange-500">R{Number(promo.sale_price ?? promoPackage.price).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">/ {promoPackage.duration}</div>
                      </div>
                      {savings && savings > 0 && (
                        <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-1">Save R{savings.toLocaleString()}!</span>
                      )}
                    </div>
                    {promoPackage.deliverables && (
                      <div className="mt-3 pt-3 border-t border-orange-500/20">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">What you get</div>
                        <ul className="space-y-1">
                          {promoPackage.deliverables.split("\n").filter((d: string) => d.trim()).map((d: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Check size={11} className="text-orange-500 shrink-0 mt-0.5"/>
                              <span className="text-muted-foreground">{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button onClick={claimOffer}
                      className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-md text-sm font-semibold inline-flex items-center gap-2 transition-colors">
                      Book this deal <ArrowRight size={14}/>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="eyebrow">Gallery</span>
            <h1 className="font-display text-5xl md:text-7xl font-bold mt-3">Browse our <span className="text-gradient-warm">work</span></h1>
          </div>
          <Link to="/favourites" className="panel px-4 py-2.5 rounded-full text-sm inline-flex items-center gap-2 hover:border-primary transition-colors">
            <Heart size={14} className={count > 0 ? "fill-primary text-primary" : ""}/>
            Favourites
            {count > 0 && <span className="bg-primary text-primary-foreground rounded-full text-[10px] min-w-[18px] h-[18px] px-1 grid place-items-center font-bold">{count}</span>}
          </Link>
        </div>

        {/* Category tabs */}
        <div className="mt-8 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
          <Link to="/pricing" search={tab === "All" ? {} : ({ category: tab } as any)}
            className="btn-lime px-5 py-2.5 rounded-full text-sm whitespace-nowrap inline-flex items-center gap-2">
            Book {tab === "All" ? "a session" : tab.toLowerCase()} <ArrowRight size={14}/>
          </Link>
        </div>

        {/* Photos / Video toggle */}
        <div className="mt-6 inline-flex p-1 bg-secondary rounded-full">
          <button onClick={() => setMode("photos")}
            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all ${mode === "photos" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}>
            <ImageIcon size={12}/> Photos ({filteredPhotos.length})
          </button>
          <button onClick={() => setMode("video")} disabled={!hasVideos}
            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${mode === "video" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}>
            <Play size={12}/> Videos ({filteredVideos.length})
          </button>
        </div>

        {/* Photos masonry */}
        {mode === "photos" && (
          allMedia.length === 0 ? (
            <div className="mt-16 rounded-2xl border-2 border-dashed border-border py-20 text-center text-muted-foreground">
              <ImageIcon size={32} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">No photos yet.</p>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="mt-16 text-center text-muted-foreground py-12">No photos in this category yet.</div>
          ) : (
            <div className="mt-8 columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
              {filteredPhotos.map((img: any, i: number) => {
                const fav = isFav(img.url);
                return (
                  <div key={img.id ?? i} className="mb-3 break-inside-avoid relative group rounded-xl overflow-hidden bg-secondary">
                    <button onClick={() => setLightbox(img.url)} className="block w-full">
                      <img src={img.url} alt={img.category} loading="lazy"
                        className="w-full h-auto block hover:scale-105 transition-transform duration-700"/>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggle({ url: img.url, category: img.category, caption: img.caption ?? null }); }}
                      className={`absolute top-2 right-2 w-9 h-9 rounded-full grid place-items-center backdrop-blur transition-all ${fav ? "bg-primary text-primary-foreground" : "bg-background/70 text-foreground opacity-0 group-hover:opacity-100"}`}>
                      <Heart size={16} className={fav ? "fill-current" : ""}/>
                    </button>
                    {img.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {img.caption}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Video grid */}
        {mode === "video" && (
          filteredVideos.length === 0 ? (
            <div className="mt-16 rounded-2xl border-2 border-dashed border-border py-20 text-center text-muted-foreground">
              <Play size={32} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">No videos in this category yet.</p>
            </div>
          ) : (
            <div className="mt-8 grid md:grid-cols-2 gap-5">
              {filteredVideos.map((v: any, i: number) => (
                <div key={v.id ?? i} className="panel overflow-hidden">
                  <div className="aspect-video bg-black">
                    <VideoEmbed url={v.video_url} title={v.name} className="w-full h-full"/>
                  </div>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{v.category}</div>
                      <div className="font-display text-lg font-bold">{v.name}</div>
                    </div>
                    <Link to="/contact" search={{ category: v.category, package: v.source === "package" ? v.name : undefined } as any}
                      className="btn-lime px-4 py-2 rounded-md text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
                      Book this session <ArrowRight size={12}/>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Bottom CTA */}
        <div className="mt-12 panel p-8 text-center">
          <h3 className="font-display text-2xl md:text-3xl font-bold">Like what you see?</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Book your {tab === "All" ? "session" : tab.toLowerCase() + " session"} today — limited slots available.
          </p>
          <Link to="/pricing" search={tab === "All" ? {} : ({ category: tab } as any)}
            className="mt-5 inline-flex btn-lime px-6 py-3 rounded-md text-sm items-center gap-2">
            View packages <ArrowRight size={14}/>
          </Link>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 grid place-items-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-primary transition-colors" onClick={() => setLightbox(null)}>
            <X size={28}/>
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg"/>
        </div>
      )}
    </Layout>
  );
}
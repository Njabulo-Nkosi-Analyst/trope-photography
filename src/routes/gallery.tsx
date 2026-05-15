import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

const FALLBACK = [
  { category: "Weddings", url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80" },
  { category: "Weddings", url: "https://images.unsplash.com/photo-1525772764200-be829a350797?auto=format&fit=crop&w=900&q=80" },
  { category: "Portraits", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80" },
  { category: "Portraits", url: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80" },
  { category: "Portraits", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80" },
  { category: "Events", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80" },
  { category: "Events", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80" },
  { category: "Products", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80" },
  { category: "Products", url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80" },
  { category: "Maternity", url: "https://images.unsplash.com/photo-1519011985187-444d62641929?auto=format&fit=crop&w=900&q=80" },
  { category: "Kids", url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80" },
  { category: "Kids", url: "https://images.unsplash.com/photo-1547956077-90c81fee2c11?auto=format&fit=crop&w=900&q=80" },
  { category: "Corporate", url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80" },
  { category: "Corporate", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80" },
];

const TABS = ["All", "Weddings", "Portraits", "Events", "Products", "Maternity", "Kids", "Corporate"];

export const Route = createFileRoute("/gallery")({
  head: () => ({ meta: [{ title: "Gallery — Garlo Studio" }] }),
  component: Gallery,
});

function Gallery() {
  const [tab, setTab] = useState("All");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: images = FALLBACK } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data } = await supabase.from("gallery_images").select("*").order("sort_order");
      return data && data.length > 0 ? data : FALLBACK;
    },
  });

  const filtered = tab === "All" ? images : images.filter(i => i.category === tab);

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20">
        <span className="eyebrow">Gallery</span>
        <h1 className="font-display text-5xl md:text-7xl font-bold mt-3">
          Browse my <span className="text-gradient-warm">work</span>
        </h1>
        <div className="mt-8 flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="mt-10 columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
          {filtered.map((img, i) => (
            <button key={i} onClick={() => setLightbox(img.url)}
              className="mb-3 break-inside-avoid block w-full overflow-hidden rounded-xl bg-secondary">
              <img src={img.url} alt={img.category} loading="lazy"
                className="w-full hover:scale-105 transition-transform duration-700" />
            </button>
          ))}
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

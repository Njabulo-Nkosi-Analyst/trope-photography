import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LogOut, ArrowRight, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Your dashboard — Trope " }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/sign-in" }); }, [user, loading, nav]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => user ? (await supabase.from("profiles").select("*").eq("id", user.id).single()).data : null,
    enabled: !!user,
  });
  const { data: inquiries = [] } = useQuery({
    queryKey: ["my-inquiries", user?.id],
    queryFn: async () => user ? (await supabase.from("inquiries").select("*").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [] : [],
    enabled: !!user,
  });

  // Pull all packages so we can map package_interest -> cover image
  const { data: packages = [] } = useQuery({
    queryKey: ["packages-cover"],
    queryFn: async () => (await supabase.from("packages").select("id, name, category, cover_image_url, price, duration").eq("is_active", true)).data ?? [],
  });
  const pkgByName = new Map(packages.map(p => [p.name, p]));

  // Gallery thumbs grouped by category (fallback when package has no cover)
  const { data: galleryByCategory = {} } = useQuery({
    queryKey: ["gallery-by-cat"],
    queryFn: async () => {
      const { data } = await supabase.from("gallery_images").select("category, url").order("sort_order");
      const map: Record<string, string> = {};
      (data ?? []).forEach(g => { if (!map[g.category]) map[g.category] = g.url; });
      return map;
    },
  });

  const { register, handleSubmit, reset } = useForm<{ full_name: string; whatsapp: string; phone: string }>();
  useEffect(() => { if (profile) reset(profile as any); }, [profile, reset]);

  const save = async (d: any) => {
    const { error } = await supabase.from("profiles").update(d).eq("id", user!.id);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  if (!user) return null;

  const coverFor = (i: any): string | null => {
    const pkg = pkgByName.get(i.package_interest ?? "");
    if (pkg?.cover_image_url) return pkg.cover_image_url;
    const cat = i.category ?? "";
    return galleryByCategory[cat] ?? galleryByCategory[cat + "s"] ?? null;
  };

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">Hi, <span className="text-gradient-warm">{profile?.full_name ?? user.email}</span></h1>
          </div>
          <button onClick={() => { signOut(); nav({ to: "/" }); }} className="btn-ghost-dark px-4 py-2 rounded-md text-sm flex items-center gap-2"><LogOut size={14} /> Sign out</button>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 panel p-6">
            <h2 className="font-display text-xl font-bold mb-4">Your bookings</h2>
            {inquiries.length === 0 ? (
              <div className="text-sm text-muted-foreground">No inquiries yet. <Link to="/contact" className="text-primary">Book a session →</Link></div>
            ) : (
              <ul className="space-y-3">
                {inquiries.map(i => {
                  const cover = coverFor(i);
                  const pkg = pkgByName.get(i.package_interest ?? "");
                  return (
                    <li key={i.id} className="flex gap-4 p-3 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary shrink-0 grid place-items-center">
                        {cover ? <img src={cover} alt={i.category ?? ""} className="w-full h-full object-cover" />
                              : <ImageIcon size={22} className="text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="font-semibold">{i.category ?? "General"} · {i.package_interest ?? "Custom"}</div>
                            {pkg && <div className="text-xs text-muted-foreground mt-0.5">R{Number(pkg.price).toLocaleString()} · {pkg.duration}</div>}
                            <div className="text-xs text-muted-foreground mt-1">Preferred: {i.preferred_date ?? "Any date"} · Sent {new Date(i.created_at).toLocaleDateString()}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${i.status === "booked" ? "bg-primary/20 text-primary" : i.status === "new" ? "bg-orange-500/20 text-orange-300" : "bg-secondary text-muted-foreground"}`}>{i.status}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* View more categories */}
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Explore more sessions</h3>
                <Link to="/gallery" className="text-xs text-primary inline-flex items-center gap-1">View more categories <ArrowRight size={12} /></Link>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(galleryByCategory).slice(0, 8).map(([cat, url]) => (
                  <Link key={cat} to="/contact" search={{ category: cat.replace(/s$/, "") } as any}
                    className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt={cat} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-1.5 left-2 right-2 text-xs font-semibold text-white">{cat}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(save)} className="panel p-6 space-y-3 h-fit">
            <h2 className="font-display text-xl font-bold mb-2">Profile</h2>
            <input {...register("full_name")} className="input" placeholder="Full name" />
            <input {...register("whatsapp")} className="input" placeholder="WhatsApp" />
            <input {...register("phone")} className="input" placeholder="Phone" />
            <button className="w-full btn-lime px-4 py-2.5 rounded-md text-sm">Save</button>
          </form>
        </div>
      </section>
      <style>{`.input{width:100%;background:var(--input);color:var(--foreground);border:1px solid var(--border);border-radius:var(--radius-md);padding:.65rem .85rem;font-size:.875rem}`}</style>
    </Layout>
  );
}

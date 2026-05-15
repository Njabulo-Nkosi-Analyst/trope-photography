import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Your dashboard — Garlo Studio" }] }),
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

  const { register, handleSubmit, reset } = useForm<{ full_name: string; whatsapp: string; phone: string }>();
  useEffect(() => { if (profile) reset(profile as any); }, [profile, reset]);

  const save = async (d: any) => {
    const { error } = await supabase.from("profiles").update(d).eq("id", user!.id);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  if (!user) return null;

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
            <h2 className="font-display text-xl font-bold mb-4">Your inquiries</h2>
            {inquiries.length === 0 ? (
              <div className="text-sm text-muted-foreground">No inquiries yet. <Link to="/contact" className="text-primary">Book a session →</Link></div>
            ) : (
              <ul className="divide-y divide-border">
                {inquiries.map(i => (
                  <li key={i.id} className="py-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-sm">{i.category ?? "General"} · {i.package_interest ?? "—"}</div>
                      <div className="text-xs text-muted-foreground mt-1">{i.preferred_date ?? "Any date"} · {new Date(i.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">{i.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleSubmit(save)} className="panel p-6 space-y-3">
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

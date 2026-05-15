import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Garlo Studio" }] }),
  component: Admin,
});

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/sign-in" });
  }, [user, loading, nav]);

  const { data: inquiries = [] } = useQuery({
    queryKey: ["all-inquiries"],
    queryFn: async () => (await supabase.from("inquiries").select("*").order("created_at", { ascending: false })).data ?? [],
    enabled: isAdmin,
  });
  const { data: packages = [] } = useQuery({
    queryKey: ["all-packages"],
    queryFn: async () => (await supabase.from("packages").select("*").order("category").order("sort_order")).data ?? [],
    enabled: isAdmin,
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["all-inquiries"] }); }
  };
  const togglePackage = async (id: string, field: "is_active" | "is_popular", val: boolean) => {
    const patch = field === "is_active" ? { is_active: val } : { is_popular: val };
    const { error } = await supabase.from("packages").update(patch).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["all-packages"] });
  };
  const updatePrice = async (id: string, price: number) => {
    const { error } = await supabase.from("packages").update({ price }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Price updated"); qc.invalidateQueries({ queryKey: ["all-packages"] }); }
  };

  if (loading) return <Layout><div className="p-10 text-center text-muted-foreground">Loading…</div></Layout>;
  if (!isAdmin) return (
    <Layout>
      <div className="max-w-md mx-auto p-10 text-center">
        <h1 className="font-display text-2xl font-bold">Admin access required</h1>
        <p className="text-sm text-muted-foreground mt-2">Sign in with an admin account to manage the studio.</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20">
        <span className="eyebrow">Admin</span>
        <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">Studio <span className="text-gradient-warm">control</span></h1>

        <div className="mt-10">
          <h2 className="font-display text-2xl font-bold mb-4">Inquiries ({inquiries.length})</h2>
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Name</th><th className="text-left p-3">Category</th><th className="text-left p-3">Package</th><th className="text-left p-3">Contact</th><th className="text-left p-3">Status</th></tr>
              </thead>
              <tbody>
                {inquiries.map(i => (
                  <tr key={i.id} className="border-b border-border/50">
                    <td className="p-3 text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold">{i.name}</td>
                    <td className="p-3">{i.category}</td>
                    <td className="p-3">{i.package_interest}</td>
                    <td className="p-3 text-xs">{i.email}<br/>{i.whatsapp}</td>
                    <td className="p-3">
                      <select value={i.status} onChange={e => updateStatus(i.id, e.target.value)}
                        className="bg-input border border-border rounded px-2 py-1 text-xs">
                        {["new","read","contacted","booked"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {inquiries.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No inquiries yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 mb-12">
          <h2 className="font-display text-2xl font-bold mb-4">Packages</h2>
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr><th className="text-left p-3">Category</th><th className="text-left p-3">Name</th><th className="text-left p-3">Price (R)</th><th className="text-left p-3">Active</th><th className="text-left p-3">Popular</th></tr>
              </thead>
              <tbody>
                {packages.map(p => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="p-3">{p.category}</td>
                    <td className="p-3 font-semibold">{p.name}</td>
                    <td className="p-3"><input type="number" defaultValue={p.price as number} onBlur={e => { const v = Number(e.target.value); if (v !== Number(p.price)) updatePrice(p.id, v); }} className="bg-input border border-border rounded px-2 py-1 w-24" /></td>
                    <td className="p-3"><input type="checkbox" checked={p.is_active} onChange={e => togglePackage(p.id, "is_active", e.target.checked)} /></td>
                    <td className="p-3"><input type="checkbox" checked={p.is_popular} onChange={e => togglePackage(p.id, "is_popular", e.target.checked)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Calendar, DollarSign, Inbox, TrendingUp, Users, CheckCircle2, Clock, Star } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TANN Photography" }] }),
  component: Admin,
});

const PIE_COLORS = ["#c4f04a", "#ff8a65", "#ffb74d", "#7c9cff", "#e879f9", "#34d399", "#fb7185"];

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "bookings" | "packages">("overview");

  useEffect(() => { if (!loading && !user) nav({ to: "/sign-in" }); }, [user, loading, nav]);

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
  const { data: testimonials = [] } = useQuery({
    queryKey: ["all-testimonials"],
    queryFn: async () => (await supabase.from("testimonials").select("*")).data ?? [],
    enabled: isAdmin,
  });

  const stats = useMemo(() => {
    const priceMap = new Map(packages.map(p => [p.name, Number(p.price)]));
    const booked = inquiries.filter(i => i.status === "booked");
    const revenue = booked.reduce((s, i) => s + (priceMap.get(i.package_interest ?? "") ?? 0), 0);
    const conversion = inquiries.length ? (booked.length / inquiries.length) * 100 : 0;
    const newCount = inquiries.filter(i => i.status === "new").length;
    const avgRating = testimonials.length ? testimonials.reduce((s, t) => s + (t.rating ?? 0), 0) / testimonials.length : 0;
    return { revenue, booked: booked.length, conversion, newCount, avgRating };
  }, [inquiries, packages, testimonials]);

  // Trend data (last 30 days)
  const trend = useMemo(() => {
    const days: Record<string, { date: string; inquiries: number; bookings: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      days[k] = { date: k.slice(5), inquiries: 0, bookings: 0 };
    }
    inquiries.forEach(i => {
      const k = (i.created_at as string).slice(0, 10);
      if (days[k]) {
        days[k].inquiries++;
        if (i.status === "booked") days[k].bookings++;
      }
    });
    return Object.values(days);
  }, [inquiries]);

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    inquiries.forEach(i => { const c = i.category ?? "Other"; m[c] = (m[c] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [inquiries]);

  const byStatus = useMemo(() => {
    const m: Record<string, number> = { new: 0, read: 0, contacted: 0, booked: 0 };
    inquiries.forEach(i => { m[i.status] = (m[i.status] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [inquiries]);

  const topPackages = useMemo(() => {
    const m: Record<string, number> = {};
    inquiries.forEach(i => { const p = i.package_interest ?? "Custom"; m[p] = (m[p] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [inquiries]);

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
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="eyebrow">Owner Dashboard</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">Studio <span className="text-gradient-warm">control</span></h1>
          </div>
          <div className="flex gap-2 p-1 bg-secondary rounded-full">
            {(["overview", "bookings", "packages"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs uppercase tracking-wider rounded-full transition-all ${tab === t ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === "overview" && (
          <>
            {/* KPI cards */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <KPI icon={<DollarSign size={18}/>} label="Revenue (booked)" value={`R${stats.revenue.toLocaleString()}`} accent />
              <KPI icon={<CheckCircle2 size={18}/>} label="Bookings" value={stats.booked.toString()} />
              <KPI icon={<Inbox size={18}/>} label="Total inquiries" value={inquiries.length.toString()} />
              <KPI icon={<TrendingUp size={18}/>} label="Conversion" value={`${stats.conversion.toFixed(1)}%`} />
              <KPI icon={<Clock size={18}/>} label="New (unread)" value={stats.newCount.toString()} />
            </div>

            {/* Trend chart */}
            <div className="mt-6 panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold">Inquiries & bookings — last 30 days</h2>
                <div className="text-xs text-muted-foreground flex gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Inquiries</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400" /> Bookings</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c4f04a" stopOpacity={0.5}/><stop offset="100%" stopColor="#c4f04a" stopOpacity={0}/></linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb923c" stopOpacity={0.5}/><stop offset="100%" stopColor="#fb923c" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="inquiries" stroke="#c4f04a" strokeWidth={2} fill="url(#g1)" />
                  <Area type="monotone" dataKey="bookings" stroke="#fb923c" strokeWidth={2} fill="url(#g2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Two-column charts */}
            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <div className="panel p-6">
                <h2 className="font-display text-xl font-bold mb-4">Inquiries by category</h2>
                {byCategory.length === 0 ? <Empty/> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                        {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="panel p-6">
                <h2 className="font-display text-xl font-bold mb-4">Top requested packages</h2>
                {topPackages.length === 0 ? <Empty/> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topPackages} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis type="number" stroke="#888" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#888" fontSize={11} width={100} />
                      <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 8 }} />
                      <Bar dataKey="value" fill="#c4f04a" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pipeline + Recent */}
            <div className="mt-6 grid lg:grid-cols-3 gap-6">
              <div className="panel p-6 lg:col-span-1">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Users size={18}/> Pipeline</h2>
                <div className="space-y-3">
                  {byStatus.map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{s.name}</span>
                        <span className="text-muted-foreground">{s.value}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${inquiries.length ? (s.value / inquiries.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                  <Star size={16} className="fill-primary text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Avg rating</div>
                    <div className="font-display text-2xl font-bold">{stats.avgRating.toFixed(2)} <span className="text-xs text-muted-foreground">({testimonials.length} reviews)</span></div>
                  </div>
                </div>
              </div>
              <div className="panel p-6 lg:col-span-2">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Calendar size={18}/> Recent inquiries</h2>
                <div className="space-y-2">
                  {inquiries.slice(0, 6).map(i => (
                    <div key={i.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{i.name} <span className="text-muted-foreground font-normal">· {i.category ?? "—"}</span></div>
                        <div className="text-xs text-muted-foreground truncate">{i.email} · {i.package_interest ?? "Custom"}</div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(i.created_at).toLocaleDateString()}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${i.status === "booked" ? "bg-primary/20 text-primary" : i.status === "new" ? "bg-orange-500/20 text-orange-300" : "bg-secondary text-muted-foreground"}`}>{i.status}</span>
                    </div>
                  ))}
                  {inquiries.length === 0 && <Empty/>}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "bookings" && (
          <div className="mt-8 panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Name</th><th className="text-left p-3">Category</th><th className="text-left p-3">Package</th><th className="text-left p-3">Preferred</th><th className="text-left p-3">Contact</th><th className="text-left p-3">Status</th></tr>
              </thead>
              <tbody>
                {inquiries.map(i => (
                  <tr key={i.id} className="border-b border-border/50">
                    <td className="p-3 text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold">{i.name}</td>
                    <td className="p-3">{i.category}</td>
                    <td className="p-3">{i.package_interest}</td>
                    <td className="p-3 text-muted-foreground">{i.preferred_date ?? "—"}</td>
                    <td className="p-3 text-xs">{i.email}<br/>{i.whatsapp}</td>
                    <td className="p-3">
                      <select value={i.status} onChange={e => updateStatus(i.id, e.target.value)}
                        className="bg-input border border-border rounded px-2 py-1 text-xs">
                        {["new","read","contacted","booked"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {inquiries.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No inquiries yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "packages" && (
          <div className="mt-8 panel overflow-x-auto">
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
        )}
      </section>
    </Layout>
  );
}

function KPI({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`panel p-4 ${accent ? "border-primary/40" : ""}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className={accent ? "text-primary" : ""}>{icon}</span>
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${accent ? "text-gradient-warm" : ""}`}>{value}</div>
    </div>
  );
}

function Empty() {
  return <div className="text-center text-muted-foreground text-sm py-12">No data yet — bookings will appear here.</div>;
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  Calendar, DollarSign, Inbox, TrendingUp, Users, CheckCircle2, Clock, Star,
  Tag, Trash2, Plus, Target, Percent, Activity, Wallet,
  Bell, Fuel, UserPlus, Receipt, X, TrendingDown, PiggyBank, MapPin,
  MessageCircle, CreditCard, ChevronDown, Eye, ChevronUp, AlertCircle,
} from "lucide-react";
import { PackagesTab } from "@/components/admin/PackagesTab";
import { AvailabilityTab } from "@/components/admin/AvailabilityTab";
import { TEMPLATES, waLink, type BookingForTemplate } from "@/lib/whatsappTemplates";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Tann Media" }] }),
  component: Admin,
});

// ── Single source of truth for bank + colours ──
const BANK = { name: "Capitec Business", account: "Tann Photography", number: "1054114595" };
const GOLD = "#C9A025";
const GOLD2 = "#E8C040";
const CHART_COLORS = [GOLD, GOLD2, "#FFFFFF", "#A07010", "#D4B030", "#F0D060", "#806010"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS = [2024, 2025, 2026];

type Tab = "overview" | "bookings" | "finance" | "alerts" | "packages" | "availability" | "reviews" | "hero" | "gallery" | "promo";

// ── Month / Year picker ──
function MonthYearPicker({ month, year, onMonth, onYear }: {
  month: number; year: number; onMonth: (m: number) => void; onYear: (y: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">Filter:</span>
      <select value={month} onChange={e => onMonth(Number(e.target.value))}
        className="bg-input border border-border rounded-md px-3 py-1.5 text-sm">
        {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
      </select>
      <select value={year} onChange={e => onYear(Number(e.target.value))}
        className="bg-input border border-border rounded-md px-3 py-1.5 text-sm">
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmFor, setConfirmFor] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => { if (!loading && !user) nav({ to: "/sign-in" }); }, [user, loading, nav]);

  const { data: inquiries = [] } = useQuery({
    queryKey: ["all-inquiries"],
    queryFn: async () => (await supabase.from("inquiries").select("*").order("created_at", { ascending: false })).data ?? [],
    enabled: isAdmin, refetchInterval: 30000,
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
  const { data: hero = [] } = useQuery({
    queryKey: ["all-hero"],
    queryFn: async () => (await supabase.from("hero_images").select("*").order("sort_order")).data ?? [],
    enabled: isAdmin,
  });
  const { data: gallery = [] } = useQuery({
    queryKey: ["all-gallery"],
    queryFn: async () => (await supabase.from("gallery_images").select("*").order("category").order("sort_order")).data ?? [],
    enabled: isAdmin,
  });
  const { data: promo } = useQuery({
    queryKey: ["any-promo"],
    queryFn: async () => (await supabase.from("promotions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
    enabled: isAdmin,
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["all-bookings"],
    queryFn: async () => (await supabase.from("bookings").select("*").order("confirmed_at", { ascending: false })).data ?? [],
    enabled: isAdmin, refetchInterval: 30000,
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["all-expenses"],
    queryFn: async () => (await supabase.from("booking_expenses").select("*")).data ?? [],
    enabled: isAdmin,
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["all-notifications"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
    enabled: isAdmin, refetchInterval: 30000,
  });

  const priceMap = useMemo(() => new Map(packages.map((p: any) => [p.name, Number(p.price)])), [packages]);
  const expensesByBooking = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach((e: any) => m.set(e.booking_id, (m.get(e.booking_id) ?? 0) + Number(e.amount)));
    return m;
  }, [expenses]);

  const monthBookings = useMemo(() =>
    bookings.filter((b: any) => {
      const d = new Date(b.confirmed_at);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }), [bookings, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const src = monthBookings;
    const netRevenue = src.reduce((s: number, b: any) => s + Number(b.final_price), 0);
    const grossRevenue = src.reduce((s: number, b: any) => s + Number(b.package_price), 0);
    const totalDiscounts = src.reduce((s: number, b: any) => s + Number(b.discount_amount), 0);
    const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
    const netProfit = netRevenue - totalExpenses;
    const aov = src.length ? netRevenue / src.length : 0;
    const margin = netRevenue ? (netProfit / netRevenue) * 100 : 0;
    const discountImpact = grossRevenue ? (totalDiscounts / grossRevenue) * 100 : 0;
    const pipelineValue = inquiries.filter((i: any) => i.status !== "booked")
      .reduce((s: number, i: any) => s + (priceMap.get(i.package_interest ?? "") ?? 0), 0);
    const conversion = inquiries.length ? (bookings.length / inquiries.length) * 100 : 0;
    const newCount = inquiries.filter((i: any) => i.status === "new").length;
    const avgRating = testimonials.length
      ? testimonials.reduce((s: number, t: any) => s + (t.rating ?? 0), 0) / testimonials.length : 0;
    const now = Date.now(); const week = 7 * 86400000;
    const last7 = inquiries.filter((i: any) => now - new Date(i.created_at).getTime() < week).length;
    const prev7 = inquiries.filter((i: any) => { const d = now - new Date(i.created_at).getTime(); return d >= week && d < 2 * week; }).length;
    const growth = prev7 ? ((last7 - prev7) / prev7) * 100 : last7 ? 100 : 0;
    const prevMonthStart = new Date(selectedYear, selectedMonth - 1, 1).getTime();
    const thisMonthStart = new Date(selectedYear, selectedMonth, 1).getTime();
    const lastMonthRev = bookings.filter((b: any) => {
      const t = new Date(b.confirmed_at).getTime(); return t >= prevMonthStart && t < thisMonthStart;
    }).reduce((s: number, b: any) => s + Number(b.final_price), 0);
    const monthGrowth = lastMonthRev ? ((netRevenue - lastMonthRev) / lastMonthRev) * 100 : netRevenue ? 100 : 0;
    const spendByClient = new Map<string, number>();
    src.forEach((b: any) => { const key = (b.client_email || b.client_name || b.id).toLowerCase(); spendByClient.set(key, (spendByClient.get(key) ?? 0) + Number(b.final_price)); });
    const uniqueClients = spendByClient.size;
    const avgSpendPerClient = uniqueClients ? netRevenue / uniqueClients : 0;
    const catTotals: Record<string, number> = {};
    expenses.forEach((e: any) => { catTotals[e.type] = (catTotals[e.type] ?? 0) + Number(e.amount); });
    const topExpense = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0] ?? ["—", 0];
    return {
      netRevenue, grossRevenue, totalDiscounts, totalExpenses, netProfit, aov, margin,
      discountImpact, pipelineValue, conversion, newCount, avgRating, last7, growth,
      bookings: src.length, topExpense, lastMonthRev, monthGrowth, uniqueClients,
      avgSpendPerClient, hasBookings: src.length > 0,
    };
  }, [monthBookings, expenses, inquiries, bookings, priceMap, testimonials, selectedMonth, selectedYear]);

  const trend = useMemo(() => {
    const days: Record<string, any> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      days[k] = { date: k.slice(5), inquiries: 0, bookings: 0, revenue: 0, profit: 0 };
    }
    inquiries.forEach((i: any) => { const k = (i.created_at as string).slice(0, 10); if (days[k]) days[k].inquiries++; });
    bookings.forEach((b: any) => {
      const k = (b.confirmed_at as string).slice(0, 10);
      if (days[k]) { days[k].bookings++; days[k].revenue += Number(b.final_price); days[k].profit += Number(b.final_price) - (expensesByBooking.get(b.id) ?? 0); }
    });
    return Object.values(days);
  }, [inquiries, bookings, expensesByBooking]);

  const revenueByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    monthBookings.forEach((b: any) => { const c = b.category ?? "Other"; m[c] = (m[c] ?? 0) + Number(b.final_price); });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthBookings]);

  const byStatus = useMemo(() => {
    const m: Record<string, number> = { new: 0, read: 0, contacted: 0, booked: 0 };
    inquiries.forEach((i: any) => { m[i.status] = (m[i.status] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [inquiries]);

  const topPackages = useMemo(() => {
    const m: Record<string, number> = {};
    monthBookings.forEach((b: any) => { const p = b.package_name ?? "Custom"; m[p] = (m[p] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [monthBookings]);

  const unreadAlerts = notifications.filter((n: any) => !n.is_read).length;
  const awaitingDeposits = bookings.filter((b: any) => b.deposit_status === "awaiting" || !b.deposit_status).length;
  const pendingReviews = testimonials.filter((t: any) => t.is_approved === false).length;
  const refresh = (...keys: string[]) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); refresh("all-inquiries"); }
  };

  if (loading) return <Layout><div className="p-10 text-center text-muted-foreground">Loading…</div></Layout>;
  if (!isAdmin) return <Layout><div className="max-w-md mx-auto p-10 text-center"><h1 className="font-display text-2xl font-bold">Admin access required</h1></div></Layout>;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "bookings", label: "Bookings", badge: stats.newCount || undefined },
    { id: "finance", label: "Finance" },
    { id: "alerts", label: "Alerts", badge: unreadAlerts || undefined },
    { id: "packages", label: "Packages" },
    { id: "availability", label: "Availability" },
    { id: "reviews", label: "Reviews", badge: pendingReviews || undefined },
    { id: "hero", label: "Hero" },
    { id: "gallery", label: "Gallery" },
    { id: "promo", label: "Promo" },
  ];

  const tooltipStyle = { background: "#111", border: `1px solid ${GOLD}`, borderRadius: 8, color: "#fff" };

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="eyebrow">Owner Dashboard</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-3">Studio <span className="text-gradient-warm">control</span></h1>
          </div>
          <div className="flex flex-wrap gap-1 p-1 bg-secondary rounded-full overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative px-3 py-2 text-xs uppercase tracking-wider rounded-full transition-all whitespace-nowrap ${tab === t.id ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                {t.label}
                {t.badge ? <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full px-1 grid place-items-center font-bold">{t.badge}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <>
            <div className="mt-6 flex items-center gap-4 flex-wrap justify-between">
              <MonthYearPicker month={selectedMonth} year={selectedYear} onMonth={setSelectedMonth} onYear={setSelectedYear} />
              <span className="text-xs text-muted-foreground">{stats.bookings} booking(s) · R{stats.netRevenue.toLocaleString()} revenue</span>
            </div>

            {!stats.hasBookings && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-secondary/50 border border-border rounded-lg text-sm text-muted-foreground">
                <AlertCircle size={14} className="text-primary shrink-0" />
                No bookings in {MONTHS[selectedMonth]} {selectedYear}. KPIs show R0. Expenses are all-time totals.
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <KPI icon={<PiggyBank size={18}/>} label="Net profit" value={`R${stats.netProfit.toLocaleString()}`} accent
                tone={stats.netProfit < 0 ? "loss" : "good"}
                hint={!stats.hasBookings ? "No bookings this month" : stats.netProfit < 0 ? "⚠ Review expenses" : undefined} />
              <KPI icon={<TrendingUp size={18}/>} label="Month growth" value={`${stats.monthGrowth >= 0 ? "+" : ""}${stats.monthGrowth.toFixed(1)}%`}
                tone={stats.monthGrowth < 0 ? "loss" : stats.monthGrowth > 0 ? "good" : "neutral"}
                hint={`vs prev month R${stats.lastMonthRev.toLocaleString()}`} />
              <KPI icon={<Users size={18}/>} label="Avg spend / client" value={`R${Math.round(stats.avgSpendPerClient).toLocaleString()}`}
                hint={stats.hasBookings ? `${stats.uniqueClients} unique client(s)` : "No bookings this month"} />
              <KPI icon={<Percent size={18}/>} label="Avg margin" value={stats.hasBookings ? `${stats.margin.toFixed(1)}%` : "—"}
                tone={stats.margin < 0 ? "loss" : stats.margin > 30 ? "good" : "neutral"} />
              <KPI icon={<DollarSign size={18}/>} label="Net revenue" value={`R${stats.netRevenue.toLocaleString()}`} />
              <KPI icon={<CreditCard size={18}/>} label="Awaiting deposits" value={awaitingDeposits.toString()}
                tone={awaitingDeposits > 0 ? "neutral" : "good"}
                hint={awaitingDeposits > 0 ? "Bookings without deposit" : "All caught up"} />
              <KPI icon={<Wallet size={18}/>} label="Deposits this month"
                value={`R${bookings.filter((b: any) => b.deposit_received_at && new Date(b.deposit_received_at).getMonth() === selectedMonth && new Date(b.deposit_received_at).getFullYear() === selectedYear).reduce((s: number, b: any) => s + Number(b.final_price) / 2, 0).toLocaleString()}`} />
              <KPI icon={<TrendingDown size={18}/>} label="Expenses (all time)" value={`R${stats.totalExpenses.toLocaleString()}`} />
              <KPI icon={<Tag size={18}/>} label="Discount impact" value={stats.hasBookings ? `-R${stats.totalDiscounts.toLocaleString()} (${stats.discountImpact.toFixed(1)}%)` : "—"} />
              <KPI icon={<Target size={18}/>} label="Avg order value" value={stats.hasBookings ? `R${Math.round(stats.aov).toLocaleString()}` : "—"} />
              <KPI icon={<Activity size={18}/>} label="Pipeline value" value={`R${stats.pipelineValue.toLocaleString()}`} />
              <KPI icon={<CheckCircle2 size={18}/>} label="Confirmed bookings" value={stats.bookings.toString()} />
              <KPI icon={<Percent size={18}/>} label="Conversion" value={`${stats.conversion.toFixed(1)}%`} />
              <KPI icon={<Inbox size={18}/>} label="Total inquiries" value={inquiries.length.toString()} />
              <KPI icon={<Star size={18}/>} label="Avg rating" value={stats.avgRating.toFixed(2)} />
            </div>

            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <div className="panel p-6">
                <h2 className="font-display text-xl font-bold mb-4">Inquiries & bookings — 30 days</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GOLD} stopOpacity={0.5}/><stop offset="100%" stopColor={GOLD} stopOpacity={0}/></linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity={0.2}/><stop offset="100%" stopColor="#fff" stopOpacity={0}/></linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#555" fontSize={11} />
                    <YAxis stroke="#555" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="inquiries" stroke={GOLD} strokeWidth={2} fill="url(#g1)" name="Inquiries" />
                    <Area type="monotone" dataKey="bookings" stroke="#fff" strokeWidth={2} fill="url(#g2)" name="Bookings" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="panel p-6">
                <h2 className="font-display text-xl font-bold mb-4">Revenue vs profit — 30 days</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trend}>
                    <XAxis dataKey="date" stroke="#555" fontSize={11} />
                    <YAxis stroke="#555" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `R${Number(v).toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5} dot={false} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke={GOLD2} strokeWidth={2.5} dot={false} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <div className="panel p-6">
                <h2 className="font-display text-xl font-bold mb-4">Revenue by category</h2>
                {revenueByCategory.length === 0 ? <Empty msg="No bookings this month" /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={revenueByCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                        {revenueByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `R${Number(v).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="panel p-6">
                <h2 className="font-display text-xl font-bold mb-4">Top booked packages</h2>
                {topPackages.length === 0 ? <Empty msg="No bookings this month" /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topPackages} layout="vertical">
                      <XAxis type="number" stroke="#555" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#555" fontSize={11} width={110} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill={GOLD} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="mt-6 grid lg:grid-cols-3 gap-6">
              <div className="panel p-6 lg:col-span-1">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Users size={18} /> Pipeline</h2>
                <div className="space-y-3">
                  {byStatus.map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between text-sm mb-1"><span className="capitalize">{s.name}</span><span className="text-muted-foreground">{s.value}</span></div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${inquiries.length ? (s.value / inquiries.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
                  <div>This week: <span className="text-foreground font-semibold">{stats.last7}</span> inquiries</div>
                  <div>WoW: <span className={`font-semibold ${stats.growth >= 0 ? "text-primary" : "text-orange-400"}`}>{stats.growth >= 0 ? "+" : ""}{stats.growth.toFixed(0)}%</span></div>
                  <div>Top expense: <span className="text-foreground font-semibold capitalize">{stats.topExpense[0]} (R{Number(stats.topExpense[1]).toLocaleString()})</span></div>
                </div>
              </div>
              <div className="panel p-6 lg:col-span-2">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Calendar size={18} /> Recent inquiries</h2>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {inquiries.slice(0, 15).map((i: any) => (
                    <InquiryRow key={i.id} inquiry={i} onConfirm={() => setConfirmFor(i)} onUpdateStatus={updateStatus} />
                  ))}
                  {inquiries.length === 0 && <Empty />}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "bookings" && <BookingsTab inquiries={inquiries} bookings={bookings} setConfirmFor={setConfirmFor} updateStatus={updateStatus} refresh={refresh} />}
        {tab === "finance" && <FinanceTab bookings={bookings} expenses={expenses} expensesByBooking={expensesByBooking} qc={qc} />}
        {tab === "alerts" && <AlertsTab notifications={notifications} qc={qc} />}
        {tab === "packages" && <PackagesTab />}
        {tab === "availability" && <AvailabilityTab />}
        {tab === "reviews" && <ReviewsTab testimonials={testimonials} qc={qc} />}
        {tab === "hero" && <HeroManager hero={hero} qc={qc} />}
        {tab === "gallery" && <GalleryManager gallery={gallery} qc={qc} />}
        {tab === "promo" && <PromoManager promo={promo} qc={qc} />}
      </section>

      {confirmFor && (
        <ConfirmDialog
          inquiry={confirmFor}
          packages={packages}
          onClose={() => setConfirmFor(null)}
          onDone={() => { setConfirmFor(null); refresh("all-inquiries", "all-bookings", "all-notifications"); }}
        />
      )}
    </Layout>
  );
}

// ── KPI card ──
function KPI({ icon, label, value, accent, tone, hint }: {
  icon: React.ReactNode; label: string; value: string;
  accent?: boolean; tone?: "loss" | "good" | "neutral"; hint?: string;
}) {
  const toneCls = tone === "loss" ? "border-destructive/60 bg-destructive/10" : tone === "good" ? "border-primary/40" : "";
  const valueCls = tone === "loss" ? "text-destructive" : accent ? "text-gradient-warm" : "";
  return (
    <div className={`panel p-4 ${accent && tone !== "loss" ? "border-primary/40" : ""} ${toneCls}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className={tone === "loss" ? "text-destructive" : accent ? "text-primary" : ""}>{icon}</span>
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${valueCls}`}>{value}</div>
      {hint && <div className={`text-[11px] mt-1 ${tone === "loss" ? "text-destructive" : "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}

function Empty({ msg }: { msg?: string }) {
  return <div className="text-center text-muted-foreground text-sm py-12">{msg ?? "No data yet."}</div>;
}

function Lbl({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-xs text-muted-foreground mb-1.5 font-medium">{t}</div>{children}</label>;
}

// ── Inquiry Row — expandable with full pricing details ──
function InquiryRow({ inquiry: i, onConfirm, onUpdateStatus }: {
  inquiry: any; onConfirm: () => void; onUpdateStatus: (id: string, s: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasPrice = i.quoted_price || i.original_price;
  const isOnSale = Number(i.discount_amount) > 0 && i.original_price;

  return (
    <div className="rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-border/50">
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate text-sm">
            {i.name}<span className="text-muted-foreground font-normal"> · {i.category ?? "—"}</span>
          </div>
          <div className="text-xs text-muted-foreground truncate">{i.email} · {i.package_interest ?? "Custom"}</div>
          {i.location && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin size={10} />{i.location}
            </div>
          )}
          {hasPrice && (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {isOnSale && <span className="text-xs text-muted-foreground line-through">R{Number(i.original_price).toLocaleString()}</span>}
              {i.quoted_price && <span className="text-xs font-semibold text-primary">R{Number(i.quoted_price).toLocaleString()}</span>}
              {Number(i.addons_total) > 0 && <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">+R{Number(i.addons_total).toLocaleString()} add-ons</span>}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">{new Date(i.created_at).toLocaleDateString()}</div>
        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${i.status === "booked" ? "bg-primary/20 text-primary" : i.status === "new" ? "bg-orange-500/20 text-orange-300" : "bg-secondary text-muted-foreground"}`}>
          {i.status}
        </span>
        <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-primary p-1 shrink-0">
          {expanded ? <ChevronUp size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border/50 pt-3 space-y-3">
          {/* Pricing summary */}
          {hasPrice && (
            <div className={`p-3 rounded-lg text-xs ${isOnSale ? "bg-orange-500/10 border border-orange-500/20" : "bg-primary/5 border border-primary/10"}`}>
              <div className={`font-semibold mb-1.5 ${isOnSale ? "text-orange-400" : "text-primary"}`}>
                {isOnSale ? "🔖 Sale pricing" : "Package pricing"}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                {i.original_price && <div>Original: <span className={isOnSale ? "line-through" : "text-foreground font-semibold"}>R{Number(i.original_price).toLocaleString()}</span></div>}
                {isOnSale && <div>Discount: <span className="text-orange-400 font-semibold">−R{Number(i.discount_amount).toLocaleString()}</span></div>}
                {Number(i.addons_total) > 0 && <div>Add-ons: <span className="text-primary font-semibold">+R{Number(i.addons_total).toLocaleString()}</span></div>}
                {i.quoted_price && (
                  <div className="col-span-2 pt-1 border-t border-border/30 mt-1">
                    Total quoted: <span className="text-foreground font-bold text-sm">R{Number(i.quoted_price).toLocaleString()}</span>
                    <span className="text-muted-foreground ml-2">· deposit R{Math.round(Number(i.quoted_price) / 2).toLocaleString()}</span>
                  </div>
                )}
              </div>
              {i.promo_code_used && <div className="mt-1 text-orange-400/70 text-[10px]">Code: {i.promo_code_used}</div>}
              {i.discount_label && <div className="mt-0.5 text-muted-foreground text-[10px]">{i.discount_label}</div>}
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {i.preferred_date && <div><span className="text-muted-foreground">Date: </span>{i.preferred_date}</div>}
            {i.session_time && <div><span className="text-muted-foreground">Time: </span>{String(i.session_time).slice(0, 5)}</div>}
            {i.whatsapp && <div><span className="text-muted-foreground">WhatsApp: </span>{i.whatsapp}</div>}
            {i.location && <div className="col-span-2"><span className="text-muted-foreground">Location: </span>{i.location}</div>}
            {Array.isArray(i.selected_addons) && i.selected_addons.length > 0 && (
              <div className="col-span-2"><span className="text-muted-foreground">Add-ons: </span>{i.selected_addons.join(", ")}</div>
            )}
          </div>

          {i.message && (
            <p className="text-xs text-muted-foreground bg-secondary/50 rounded p-2 italic">"{i.message}"</p>
          )}

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <select value={i.status} onChange={e => onUpdateStatus(i.id, e.target.value)}
              className="bg-input border border-border rounded px-2 py-1 text-xs">
              {["new", "read", "contacted", "booked"].map(s => <option key={s}>{s}</option>)}
            </select>
            {i.status !== "booked" && (
              <button onClick={onConfirm} className="btn-lime px-3 py-1.5 rounded text-xs font-semibold inline-flex items-center gap-1">
                <CheckCircle2 size={12} /> Confirm booking
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bookings Tab ──
function BookingsTab({ inquiries, bookings, setConfirmFor, updateStatus, refresh }: {
  inquiries: any[]; bookings: any[]; setConfirmFor: (i: any) => void;
  updateStatus: (id: string, s: string) => void; refresh: (...k: string[]) => void;
}) {
  const [view, setView] = useState<"pending" | "completed">("pending");
  const pending = inquiries.filter((i: any) => i.status !== "booked");
  const active = bookings.filter((b: any) => b.status !== "completed" && b.status !== "cancelled");
  const completed = bookings.filter((b: any) => b.status === "completed");

  const markComplete = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "completed" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Marked completed"); refresh("all-bookings"); }
  };

  const clearCompleted = async () => {
    if (completed.length === 0) return;
    if (!confirm(`Archive ${completed.length} completed booking(s)?`)) return;
    const ids = completed.map((b: any) => b.id);
    const { error: expErr } = await supabase.from("booking_expenses").delete().in("booking_id", ids);
    if (expErr) { toast.error(`Expense cleanup failed: ${expErr.message}`); return; }
    const { error } = await supabase.from("bookings").delete().in("id", ids);
    if (error) toast.error(error.message);
    else { toast.success(`${completed.length} booking(s) cleared`); refresh("all-bookings", "all-expenses"); }
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 bg-secondary rounded-full">
          <button onClick={() => setView("pending")} className={`px-4 py-2 text-xs uppercase tracking-wider rounded-full ${view === "pending" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}>
            Pending ({pending.length + active.length})
          </button>
          <button onClick={() => setView("completed")} className={`px-4 py-2 text-xs uppercase tracking-wider rounded-full ${view === "completed" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}>
            Completed ({completed.length})
          </button>
        </div>
        {view === "completed" && completed.length > 0 && (
          <button onClick={clearCompleted} className="text-xs px-3 py-2 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex items-center gap-1.5">
            <Trash2 size={12} /> Clear completed
          </button>
        )}
      </div>

      {view === "pending" && (
        <>
          {active.length > 0 && (
            <div className="panel overflow-x-auto">
              <div className="p-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                <Clock size={12} /> Active bookings
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left p-3">Confirmed</th>
                    <th className="text-left p-3">Client</th>
                    <th className="text-left p-3">Package</th>
                    <th className="text-left p-3">Location</th>
                    <th className="text-left p-3">Session</th>
                    <th className="text-left p-3">Add-ons</th>
                    <th className="text-left p-3">Payment</th>
                    <th className="text-right p-3">Total</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((b: any) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-3 text-muted-foreground whitespace-nowrap text-xs">{new Date(b.confirmed_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="font-semibold">{b.client_name}</div>
                        <div className="text-xs text-muted-foreground">{b.client_email}</div>
                        {b.client_whatsapp && <div className="text-xs text-muted-foreground">{b.client_whatsapp}</div>}
                      </td>
                      <td className="p-3">
                        <div>{b.package_name}</div>
                        <div className="text-xs text-muted-foreground">{b.category}</div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><MapPin size={10} />{b.location ?? "—"}</div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        <div>{b.session_date ?? "—"}</div>
                        {b.session_time && <div>{String(b.session_time).slice(0, 5)}</div>}
                      </td>
                      <td className="p-3 text-xs">
                        {Array.isArray(b.selected_addons) && b.selected_addons.length > 0
                          ? <div className="text-primary">{b.selected_addons.join(", ")}</div>
                          : <span className="text-muted-foreground">—</span>}
                        {Number(b.addons_total) > 0 && <div className="text-muted-foreground">+R{Number(b.addons_total).toLocaleString()}</div>}
                      </td>
                      <td className="p-3"><DepositControls booking={b} onRefresh={() => refresh("all-bookings")} /></td>
                      <td className="p-3 text-right">
                        <div className="font-semibold">R{Number(b.final_price).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">deposit R{Math.round(Number(b.final_price) / 2).toLocaleString()}</div>
                        {Number(b.discount_amount) > 0 && (
                          <div className="text-xs text-orange-400">−R{Number(b.discount_amount).toLocaleString()} disc.</div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <WhatsAppMessageMenu booking={b} />
                          <button onClick={() => markComplete(b.id)} className="btn-lime px-3 py-1.5 rounded text-xs font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> Complete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="panel overflow-x-auto">
            <div className="p-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
              <Inbox size={12} /> New inquiries — confirm to convert to booking
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b border-border sticky top-0 bg-card z-10">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Category · Package</th>
                    <th className="text-left p-3">Location</th>
                    <th className="text-left p-3">Preferred</th>
                    <th className="text-left p-3">Pricing</th>
                    <th className="text-left p-3">Contact</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((i: any) => (
                    <tr key={i.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-3 text-muted-foreground whitespace-nowrap text-xs">{new Date(i.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold">{i.name}</td>
                      <td className="p-3">
                        <div>{i.category ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{i.package_interest ?? "Custom"}</div>
                        {Array.isArray(i.selected_addons) && i.selected_addons.length > 0 && (
                          <div className="text-[10px] text-primary mt-0.5">{i.selected_addons.join(", ")}</div>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><MapPin size={10} />{i.location ?? "—"}</div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        <div>{i.preferred_date ?? "—"}</div>
                        {i.session_time && <div>{String(i.session_time).slice(0, 5)}</div>}
                      </td>
                      <td className="p-3 text-xs">
                        {i.original_price && (
                          <div className={Number(i.discount_amount) > 0 ? "line-through text-muted-foreground" : "font-semibold"}>
                            R{Number(i.original_price).toLocaleString()}
                          </div>
                        )}
                        {Number(i.discount_amount) > 0 && (
                          <div className="text-orange-400 text-[10px]">−R{Number(i.discount_amount).toLocaleString()}</div>
                        )}
                        {i.quoted_price && (
                          <div className="font-semibold text-primary">R{Number(i.quoted_price).toLocaleString()}</div>
                        )}
                        {Number(i.addons_total) > 0 && (
                          <div className="text-[10px] text-primary">+R{Number(i.addons_total).toLocaleString()} add-ons</div>
                        )}
                      </td>
                      <td className="p-3 text-xs">
                        <div>{i.email}</div>
                        <div className="text-muted-foreground">{i.whatsapp}</div>
                      </td>
                      <td className="p-3">
                        <select value={i.status} onChange={e => updateStatus(i.id, e.target.value)}
                          className="bg-input border border-border rounded px-2 py-1 text-xs">
                          {["new", "read", "contacted", "booked"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <button onClick={() => setConfirmFor(i)} className="btn-lime px-3 py-1.5 rounded text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle2 size={12} /> Confirm
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pending.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No pending inquiries ✨</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === "completed" && (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left p-3">Completed</th>
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Package</th>
                <th className="text-left p-3">Location</th>
                <th className="text-right p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {completed.map((b: any) => (
                <tr key={b.id} className="border-b border-border/50">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(b.confirmed_at).toLocaleDateString()}</td>
                  <td className="p-3 font-semibold">{b.client_name}<div className="text-xs text-muted-foreground">{b.client_email}</div></td>
                  <td className="p-3">{b.package_name}<div className="text-xs text-muted-foreground">{b.category}</div></td>
                  <td className="p-3 text-xs text-muted-foreground">{b.location ?? "—"}</td>
                  <td className="p-3 text-right font-semibold text-primary">R{Number(b.final_price).toLocaleString()}</td>
                </tr>
              ))}
              {completed.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No completed bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Confirm Dialog — fully auto-filled from inquiry ──
function ConfirmDialog({ inquiry, packages, onClose, onDone }: {
  inquiry: any; packages: any[]; onClose: () => void; onDone: () => void;
}) {
  const matched = packages.find((p: any) => p.name === inquiry.package_interest);

  // Auto-fill all pricing from inquiry (set by customer on contact page)
  const inquiryOriginalPrice = Number(inquiry.original_price ?? matched?.price ?? 0);
  const inquiryDiscount = Number(inquiry.discount_amount ?? 0);
  const inquiryAddonsTotal = Number(inquiry.addons_total ?? 0);
  const autoPackagePrice = inquiryOriginalPrice || (matched ? Number(matched.price) : 0);

  const [packagePrice, setPackagePrice] = useState<number>(autoPackagePrice);
  const [discount, setDiscount] = useState<number>(inquiryDiscount);
  const [discountReason, setDiscountReason] = useState<string>(
    inquiry.discount_label ?? (inquiryDiscount > 0 ? "Promo / sale discount" : "")
  );
  const [sessionDate, setSessionDate] = useState<string>(inquiry.preferred_date ?? "");
  const [sessionTime, setSessionTime] = useState<string>(
    inquiry.session_time ? String(inquiry.session_time).slice(0, 5) : ""
  );
  const [location, setLocation] = useState<string>(inquiry.location ?? "");
  const [notes, setNotes] = useState<string>(inquiry.message ?? "");
  const [saving, setSaving] = useState(false);

  const addonsTotal = inquiryAddonsTotal;
  // FIXED: final = packagePrice - discount + addons (discount applied once)
  const final = Math.max(0, packagePrice - discount + addonsTotal);
  const isOnSale = inquiryDiscount > 0 && !!inquiry.original_price;
  const addonLabels = Array.isArray(inquiry.selected_addons)
    ? inquiry.selected_addons.join(", ") : inquiry.selected_addons ?? null;

  const save = async () => {
    if (packagePrice <= 0) return toast.error("Set a package price");
    if (discount > 0 && !discountReason.trim()) return toast.error("Add a reason for the discount");
    setSaving(true);
    const { error } = await supabase.from("bookings").insert({
      inquiry_id: inquiry.id,
      user_id: inquiry.user_id,
      client_name: inquiry.name,
      client_email: inquiry.email,
      client_whatsapp: inquiry.whatsapp,
      category: inquiry.category,
      package_name: inquiry.package_interest ?? "Custom",
      package_price: packagePrice,
      discount_amount: discount,
      discount_reason: discount > 0 ? discountReason : null,
      final_price: final,
      addons_total: addonsTotal > 0 ? addonsTotal : null,
      selected_addons: inquiry.selected_addons ?? null,
      session_date: sessionDate || null,
      session_time: sessionTime || null,
      location: location || null,
      notes: notes || null,
      promo_code: inquiry.promo_code_used ?? null,
    });
    if (error) { setSaving(false); return toast.error(error.message); }
    await supabase.from("inquiries").update({ status: "booked" }).eq("id", inquiry.id);
    toast.success(`Booking confirmed — R${final.toLocaleString()}`);
    setSaving(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="panel p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="eyebrow">Confirm booking</span>
            <h2 className="font-display text-2xl font-bold mt-1">{inquiry.name}</h2>
            <div className="text-xs text-muted-foreground mt-1">{inquiry.category ?? "—"} · {inquiry.package_interest ?? "Custom"}</div>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        {/* Customer details — auto-filled */}
        <div className="mb-4 p-3 rounded-lg bg-secondary/50 border border-border text-xs space-y-1">
          <div className="text-muted-foreground uppercase tracking-wider font-semibold mb-2">Customer details</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="text-muted-foreground">Email: </span>{inquiry.email}</div>
            <div><span className="text-muted-foreground">WhatsApp: </span>{inquiry.whatsapp ?? "—"}</div>
            {inquiry.location && <div className="col-span-2"><span className="text-muted-foreground">Location: </span><span className="font-semibold">{inquiry.location}</span></div>}
            {inquiry.preferred_date && <div><span className="text-muted-foreground">Requested date: </span>{inquiry.preferred_date}</div>}
            {inquiry.session_time && <div><span className="text-muted-foreground">Requested time: </span>{String(inquiry.session_time).slice(0, 5)}</div>}
            {addonLabels && <div className="col-span-2"><span className="text-muted-foreground">Add-ons: </span><span className="text-primary font-semibold">{addonLabels}</span></div>}
          </div>
        </div>

        {/* Pricing summary — auto-filled from inquiry */}
        <div className={`mb-4 p-3 rounded-lg text-xs ${isOnSale ? "bg-orange-500/10 border border-orange-500/30" : "bg-primary/10 border border-primary/20"}`}>
          <div className={`font-semibold mb-1.5 ${isOnSale ? "text-orange-400" : "text-primary"}`}>
            {isOnSale ? "🔖 Sale pricing — auto-applied from customer booking" : "Package pricing"}
          </div>
          <div className="space-y-0.5 text-muted-foreground">
            <div>Original package price: <span className={isOnSale ? "line-through" : "text-foreground font-semibold"}>R{inquiryOriginalPrice.toLocaleString()}</span></div>
            {isOnSale && <div>Discount applied: <span className="text-orange-400 font-semibold">−R{inquiryDiscount.toLocaleString()}</span></div>}
            {addonsTotal > 0 && <div>Add-ons ({addonLabels}): <span className="text-primary font-semibold">+R{addonsTotal.toLocaleString()}</span></div>}
            <div className="pt-1 border-t border-border/30 mt-1 font-semibold text-foreground">
              Final total: R{(autoPackagePrice - inquiryDiscount + addonsTotal).toLocaleString()}
            </div>
          </div>
          {inquiry.promo_code_used && <div className="mt-1 text-orange-400/70">Promo code: {inquiry.promo_code_used}</div>}
        </div>

        {/* Bank details */}
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
          <div className="font-semibold text-primary mb-1">Payment details to share with client</div>
          <div className="text-muted-foreground space-y-0.5">
            <div>Bank: <span className="text-foreground font-medium">{BANK.name}</span></div>
            <div>Account name: <span className="text-foreground font-medium">{BANK.account}</span></div>
            <div>Account number: <span className="text-foreground font-mono font-bold">{BANK.number}</span></div>
          </div>
        </div>

        <div className="space-y-3">
          <Lbl t="Package price (R) — original before discount">
            <input type="number" value={packagePrice} onChange={e => setPackagePrice(Number(e.target.value))} className="inp" />
          </Lbl>
          <div className="grid grid-cols-2 gap-3">
            <Lbl t="Discount (R)">
              <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="inp" />
            </Lbl>
            <Lbl t="Session date">
              <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="inp" />
            </Lbl>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Lbl t="Session time">
              <input type="time" value={sessionTime} onChange={e => setSessionTime(e.target.value)} className="inp" />
            </Lbl>
            <Lbl t="Location">
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Pretoria CBD" className="inp" />
            </Lbl>
          </div>
          {discount > 0 && (
            <Lbl t="Discount reason (required)">
              <input value={discountReason} onChange={e => setDiscountReason(e.target.value)}
                placeholder="e.g. Sale package, repeat client" className="inp" />
            </Lbl>
          )}
          <Lbl t="Internal notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="inp" />
          </Lbl>

          {/* Final booking summary */}
          <div className={`p-4 rounded-lg border ${isOnSale ? "bg-orange-500/10 border-orange-500/30" : "bg-primary/10 border-primary/30"}`}>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Booking summary</div>
            <div className="space-y-0.5 text-xs text-muted-foreground mb-3">
              <div><span className="text-foreground font-semibold">{inquiry.package_interest ?? "Custom"}</span> · {inquiry.category}</div>
              {sessionDate && (
                <div>📅 {new Date(sessionDate + "T00:00:00").toLocaleDateString("en-ZA", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}{sessionTime ? ` · ${sessionTime}` : ""}</div>
              )}
              {location && <div>📍 {location}</div>}
              {addonLabels && <div>➕ {addonLabels}</div>}
            </div>
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <div>
                {discount > 0 && (
                  <div className="text-xs text-muted-foreground line-through">R{(packagePrice + addonsTotal).toLocaleString()}</div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  50% deposit: <span className="font-semibold text-foreground">R{Math.round(final / 2).toLocaleString()}</span>
                </div>
              </div>
              <span className={`font-display text-3xl font-bold ${isOnSale ? "text-orange-500" : "text-primary"}`}>
                R{final.toLocaleString()}
              </span>
            </div>
            {discount > 0 && <div className="text-xs text-orange-300 mt-1">−R{discount.toLocaleString()} discount applied</div>}
            {addonsTotal > 0 && <div className="text-xs text-primary mt-1">+R{addonsTotal.toLocaleString()} add-ons included</div>}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded text-sm text-muted-foreground border border-border">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-lime px-6 py-2.5 rounded text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2">
              <CheckCircle2 size={14} /> {saving ? "Confirming…" : "Confirm booking"}
            </button>
          </div>
        </div>
        <style>{`.inp{width:100%;background:var(--input);color:var(--foreground);border:1px solid var(--border);border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem}.inp:focus{outline:2px solid var(--primary);outline-offset:2px}`}</style>
      </div>
    </div>
  );
}

// ── Finance Tab ──
function FinanceTab({ bookings, expenses, expensesByBooking, qc }: {
  bookings: any[]; expenses: any[]; expensesByBooking: Map<string, number>; qc: any;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const filteredBookings = useMemo(() =>
    bookings.filter((b: any) => {
      const d = new Date(b.confirmed_at);
      return d.getMonth() === month && d.getFullYear() === year;
    }), [bookings, month, year]);

  const monthRevenue = filteredBookings.reduce((s: number, b: any) => s + Number(b.final_price), 0);
  const monthExpenses = filteredBookings.reduce((s: number, b: any) => s + (expensesByBooking.get(b.id) ?? 0), 0);
  const monthProfit = monthRevenue - monthExpenses;
  const totalDiscounts = filteredBookings.reduce((s: number, b: any) => s + Number(b.discount_amount ?? 0), 0);
  const totalAddons = filteredBookings.reduce((s: number, b: any) => s + Number(b.addons_total ?? 0), 0);

  const clearAllExpenses = async () => {
    if (!confirm(`Clear all ${expenses.length} expense records? Cannot be undone.`)) return;
    const { error } = await supabase.from("booking_expenses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) toast.error(error.message);
    else { toast.success("All expenses cleared"); qc.invalidateQueries({ queryKey: ["all-expenses"] }); }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <MonthYearPicker month={month} year={year} onMonth={setMonth} onYear={setYear} />
        {expenses.length > 0 && (
          <button onClick={clearAllExpenses} className="text-xs px-3 py-2 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex items-center gap-1.5">
            <Trash2 size={12} /> Clear all expenses
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={<PiggyBank size={18} />} label="Month profit" value={`R${monthProfit.toLocaleString()}`} accent tone={monthProfit < 0 ? "loss" : "good"} />
        <KPI icon={<DollarSign size={18} />} label="Month revenue" value={`R${monthRevenue.toLocaleString()}`} />
        <KPI icon={<TrendingDown size={18} />} label="Month expenses" value={`R${monthExpenses.toLocaleString()}`} />
        <KPI icon={<Percent size={18} />} label="Month margin" value={monthRevenue ? `${(monthProfit / monthRevenue * 100).toFixed(1)}%` : "—"} />
        <KPI icon={<Tag size={18} />} label="Discounts given" value={totalDiscounts > 0 ? `-R${totalDiscounts.toLocaleString()}` : "R0"} />
        <KPI icon={<Plus size={18} />} label="Add-on revenue" value={`R${totalAddons.toLocaleString()}`} />
        <KPI icon={<Target size={18} />} label="Avg booking value" value={filteredBookings.length ? `R${Math.round(monthRevenue / filteredBookings.length).toLocaleString()}` : "—"} />
        <KPI icon={<CheckCircle2 size={18} />} label="Bookings this month" value={filteredBookings.length.toString()} />
      </div>

      <div className="panel p-4 lg:p-6">
        <h2 className="font-display text-xl font-bold mb-1 flex items-center gap-2"><Wallet size={18} /> Per-booking finances</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {filteredBookings.length} booking(s) in {MONTHS[month]} {year} · Log petrol, wages and costs per booking.
        </p>
        {filteredBookings.length === 0 && <Empty msg={`No bookings in ${MONTHS[month]} ${year}`} />}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredBookings.map((b: any) => {
            const spent = expensesByBooking.get(b.id) ?? 0;
            const kept = Number(b.final_price) - spent;
            const isOpen = openId === b.id;
            return (
              <div key={b.id} className="bg-secondary/40 rounded-xl border border-border overflow-hidden">
                <button onClick={() => setOpenId(isOpen ? null : b.id)} className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-secondary/70 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{b.client_name} <span className="text-muted-foreground font-normal text-sm">· {b.package_name}</span></div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(b.confirmed_at).toLocaleDateString()} · {b.category ?? "—"}
                      {b.session_date ? ` · session ${b.session_date}` : ""}
                      {b.location ? ` · ${b.location}` : ""}
                    </div>
                    {Array.isArray(b.selected_addons) && b.selected_addons.length > 0 && (
                      <div className="text-[10px] text-primary mt-0.5">{b.selected_addons.join(", ")}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Revenue</div>
                    <div className="font-semibold">R{Number(b.final_price).toLocaleString()}</div>
                    {Number(b.discount_amount) > 0 && <div className="text-[10px] text-orange-300">−R{Number(b.discount_amount).toLocaleString()} disc.</div>}
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-xs text-muted-foreground">Expenses</div>
                    <div className="font-semibold text-orange-300">−R{spent.toLocaleString()}</div>
                  </div>
                  <div className={`text-right shrink-0 px-3 py-2 rounded-lg ${kept >= 0 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                    <div className="text-[10px] uppercase tracking-wider">Kept</div>
                    <div className="font-display font-bold">R{kept.toLocaleString()}</div>
                  </div>
                </button>
                {isOpen && <BookingExpenses booking={b} items={expenses.filter((e: any) => e.booking_id === b.id)} qc={qc} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BookingExpenses({ booking, items, qc }: { booking: any; items: any[]; qc: any }) {
  const [km, setKm] = useState(""); const [rate, setRate] = useState("2.50");
  const [wageName, setWageName] = useState(""); const [wageAmount, setWageAmount] = useState("");
  const [otherLabel, setOtherLabel] = useState(""); const [otherAmount, setOtherAmount] = useState("");
  const reload = () => qc.invalidateQueries({ queryKey: ["all-expenses"] });
  const addPetrol = async () => {
    const k = Number(km), r = Number(rate);
    if (!k || !r) return toast.error("Enter km and rate");
    await supabase.from("booking_expenses").insert({ booking_id: booking.id, type: "petrol", label: `${k} km × R${r}`, km: k, rate_per_km: r, amount: +(k * r).toFixed(2) });
    setKm(""); reload();
  };
  const addWage = async () => {
    if (!wageName.trim() || !Number(wageAmount)) return toast.error("Name + amount required");
    await supabase.from("booking_expenses").insert({ booking_id: booking.id, type: "wage", label: wageName, amount: Number(wageAmount) });
    setWageName(""); setWageAmount(""); reload();
  };
  const addOther = async () => {
    if (!otherLabel.trim() || !Number(otherAmount)) return toast.error("Label + amount required");
    await supabase.from("booking_expenses").insert({ booking_id: booking.id, type: "other", label: otherLabel, amount: Number(otherAmount) });
    setOtherLabel(""); setOtherAmount(""); reload();
  };
  const remove = async (id: string) => { await supabase.from("booking_expenses").delete().eq("id", id); reload(); };

  return (
    <div className="border-t border-border p-4 grid lg:grid-cols-3 gap-4 bg-background/30">
      <div className="space-y-3">
        <div className="panel p-3">
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-2"><Fuel size={13} /> Petrol</div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input value={km} onChange={e => setKm(e.target.value)} type="number" placeholder="km" className="exp-inp" />
            <input value={rate} onChange={e => setRate(e.target.value)} type="number" step="0.01" placeholder="R/km" className="exp-inp" />
            <button onClick={addPetrol} className="btn-lime px-3 rounded text-xs"><Plus size={12} /></button>
          </div>
          {Number(km) > 0 && Number(rate) > 0 && <div className="text-xs text-muted-foreground mt-1.5">= R{(Number(km) * Number(rate)).toFixed(2)}</div>}
        </div>
        <div className="panel p-3">
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-2"><UserPlus size={13} /> Wage</div>
          <div className="space-y-2">
            <input value={wageName} onChange={e => setWageName(e.target.value)} placeholder="Name" className="exp-inp w-full" />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input value={wageAmount} onChange={e => setWageAmount(e.target.value)} type="number" placeholder="R" className="exp-inp" />
              <button onClick={addWage} className="btn-lime px-3 rounded text-xs"><Plus size={12} /></button>
            </div>
          </div>
        </div>
        <div className="panel p-3">
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-2"><Receipt size={13} /> Other</div>
          <div className="space-y-2">
            <input value={otherLabel} onChange={e => setOtherLabel(e.target.value)} placeholder="e.g. Props" className="exp-inp w-full" />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input value={otherAmount} onChange={e => setOtherAmount(e.target.value)} type="number" placeholder="R" className="exp-inp" />
              <button onClick={addOther} className="btn-lime px-3 rounded text-xs"><Plus size={12} /></button>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 panel p-3">
        <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Logged expenses</div>
        {items.length === 0 ? <div className="text-xs text-muted-foreground py-6 text-center">Nothing logged yet.</div> : (
          <div className="space-y-1.5">
            {items.map((it: any) => (
              <div key={it.id} className="flex items-center gap-2 text-sm bg-secondary/50 rounded px-3 py-2">
                <span className={`text-xs px-1.5 py-0.5 rounded uppercase font-bold ${it.type === "petrol" ? "bg-orange-500/20 text-orange-300" : it.type === "wage" ? "bg-blue-500/20 text-blue-300" : "bg-muted text-muted-foreground"}`}>{it.type}</span>
                <span className="flex-1 truncate">{it.label}</span>
                <span className="font-semibold">−R{Number(it.amount).toLocaleString()}</span>
                <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`.exp-inp{background:var(--input);color:var(--foreground);border:1px solid var(--border);border-radius:.375rem;padding:.4rem .55rem;font-size:.8rem;width:100%}.exp-inp:focus{outline:1px solid var(--primary)}`}</style>
    </div>
  );
}

// ── Alerts Tab ──
function AlertsTab({ notifications, qc }: { notifications: any[]; qc: any }) {
  const refresh = () => qc.invalidateQueries({ queryKey: ["all-notifications"] });
  const markRead = async (id: string) => { await supabase.from("notifications").update({ is_read: true }).eq("id", id); refresh(); };
  const markAll = async () => { await supabase.from("notifications").update({ is_read: true }).eq("is_read", false); refresh(); toast.success("All marked read"); };
  const remove = async (id: string) => { await supabase.from("notifications").delete().eq("id", id); refresh(); };
  const iconFor = (k: string) => k === "inquiry" ? <Inbox size={14} /> : k === "booking" ? <CheckCircle2 size={14} /> : k === "review" ? <Star size={14} /> : <Bell size={14} />;

  return (
    <div className="mt-8 panel p-4 lg:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold flex items-center gap-2"><Bell size={18} /> Notifications</h2>
        {notifications.some((n: any) => !n.is_read) && (
          <button onClick={markAll} className="text-xs text-muted-foreground hover:text-foreground underline">Mark all read</button>
        )}
      </div>
      {notifications.length === 0 ? <Empty /> : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {notifications.map((n: any) => (
            <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${n.is_read ? "bg-secondary/30" : "bg-primary/5 border border-primary/20"}`}>
              <span className={`mt-0.5 w-7 h-7 rounded-full grid place-items-center shrink-0 ${n.is_read ? "bg-secondary text-muted-foreground" : "bg-primary/20 text-primary"}`}>{iconFor(n.kind)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {!n.is_read && <button onClick={() => markRead(n.id)} className="text-xs text-primary hover:underline whitespace-nowrap">Mark read</button>}
                <button onClick={() => remove(n.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hero Manager ──
function HeroManager({ hero, qc }: { hero: any[]; qc: any }) {
  const [url, setUrl] = useState(""); const [label, setLabel] = useState(""); const [videoUrl, setVideoUrl] = useState("");
  const inv = () => { qc.invalidateQueries({ queryKey: ["all-hero"] }); qc.invalidateQueries({ queryKey: ["hero-images"] }); };
  const add = async () => {
    if (!url.trim() || !label.trim()) return toast.error("URL and label required");
    const { error } = await supabase.from("hero_images").insert({ url, category_label: label, video_url: videoUrl || null, sort_order: (hero.at(-1)?.sort_order ?? 0) + 1 } as any);
    if (error) toast.error(error.message); else { toast.success("Added"); setUrl(""); setLabel(""); setVideoUrl(""); inv(); }
  };
  const remove = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("hero_images").delete().eq("id", id); inv(); };
  const toggle = async (id: string, active: boolean) => { await supabase.from("hero_images").update({ is_active: active }).eq("id", id); inv(); };

  return (
    <div className="mt-8 space-y-6">
      <div className="panel p-6">
        <h2 className="font-display text-xl font-bold mb-4">Add hero image</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Image URL" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Weddings)" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="(Optional) Video URL" className="bg-input border border-border rounded px-3 py-2 text-sm md:col-span-2" />
          <button onClick={add} className="btn-lime px-4 py-2 rounded text-sm inline-flex items-center justify-center gap-1 md:col-span-2"><Plus size={14} /> Add</button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {hero.map((h: any) => (
          <div key={h.id} className="panel overflow-hidden">
            <div className="aspect-video bg-secondary"><img src={h.url} alt={h.category_label} className="w-full h-full object-cover" /></div>
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{h.category_label}</div>
                <label className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <input type="checkbox" checked={h.is_active} onChange={e => toggle(h.id, e.target.checked)} /> Active
                </label>
              </div>
              <button onClick={() => remove(h.id)} className="text-destructive p-2 hover:bg-destructive/10 rounded"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {hero.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">No hero images yet.</div>}
      </div>
    </div>
  );
}

// ── Gallery Manager ──
function GalleryManager({ gallery, qc }: { gallery: any[]; qc: any }) {
  const [url, setUrl] = useState(""); const [category, setCategory] = useState("Weddings"); const [caption, setCaption] = useState("");
  const cats = Array.from(new Set([...gallery.map((g: any) => g.category), "Weddings", "Portraits", "Events", "Products", "Maternity", "Kids", "Corporate"]));
  const inv = () => { qc.invalidateQueries({ queryKey: ["all-gallery"] }); qc.invalidateQueries({ queryKey: ["gallery"] }); qc.invalidateQueries({ queryKey: ["gallery-featured"] }); };
  const add = async () => {
    if (!url.trim()) return toast.error("URL required");
    await supabase.from("gallery_images").insert({ url, category, caption: caption || null, sort_order: 0 });
    toast.success("Added"); setUrl(""); setCaption(""); inv();
  };
  const remove = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("gallery_images").delete().eq("id", id); inv(); };
  const grouped = gallery.reduce<Record<string, any[]>>((acc, g: any) => { (acc[g.category] ??= []).push(g); return acc; }, {});

  return (
    <div className="mt-8 space-y-6">
      <div className="panel p-6">
        <h2 className="font-display text-xl font-bold mb-4">Add gallery image</h2>
        <div className="grid md:grid-cols-[1fr_180px_180px_auto] gap-3">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Image URL" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <input list="catlist" value={category} onChange={e => setCategory(e.target.value)} className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <datalist id="catlist">{cats.map(c => <option key={c as string} value={c as string} />)}</datalist>
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)" className="bg-input border border-border rounded px-3 py-2 text-sm" />
          <button onClick={add} className="btn-lime px-4 py-2 rounded text-sm inline-flex items-center gap-1"><Plus size={14} /> Add</button>
        </div>
      </div>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="font-display text-lg font-bold mb-3">{cat} <span className="text-muted-foreground font-normal text-sm">({(items as any[]).length})</span></h3>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {(items as any[]).map((g: any) => (
              <div key={g.id} className="relative aspect-square rounded-lg overflow-hidden group">
                <img src={g.url} alt={g.caption ?? cat} className="w-full h-full object-cover" />
                <button onClick={() => remove(g.id)} className="absolute top-1.5 right-1.5 bg-destructive/90 text-white p-1.5 rounded opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {gallery.length === 0 && <div className="text-center text-muted-foreground py-12">No images yet.</div>}
    </div>
  );
}

// ── Promo Manager — auto discount label ──
function PromoManager({ promo, qc }: { promo: any; qc: any }) {
  const { data: packages = [] } = useQuery({
    queryKey: ["all-packages"],
    queryFn: async () => (await supabase.from("packages").select("id,name,category,price").eq("is_active", true)).data ?? [],
  });

  const [form, setForm] = useState({
    title: promo?.title ?? "",
    description: promo?.description ?? "",
    discount_label: promo?.discount_label ?? "",
    ends_at: promo?.ends_at ? new Date(promo.ends_at).toISOString().slice(0, 16) : "",
    is_active: promo?.is_active ?? true,
    package_id: promo?.package_id ?? "",
    package_name: promo?.package_name ?? "",
    package_category: promo?.package_category ?? "",
    original_price: promo?.original_price ? String(promo.original_price) : "",
    sale_price: promo?.sale_price ? String(promo.sale_price) : "",
  });

  useEffect(() => {
    if (promo) setForm({
      title: promo.title ?? "", description: promo.description ?? "",
      discount_label: promo.discount_label ?? "",
      ends_at: promo.ends_at ? new Date(promo.ends_at).toISOString().slice(0, 16) : "",
      is_active: promo.is_active ?? true,
      package_id: promo.package_id ?? "", package_name: promo.package_name ?? "",
      package_category: promo.package_category ?? "",
      original_price: promo.original_price ? String(promo.original_price) : "",
      sale_price: promo.sale_price ? String(promo.sale_price) : "",
    });
  }, [promo]);

  const autoLabel = (orig: string, sale: string) => {
    const o = Number(orig); const s = Number(sale);
    if (o > 0 && s > 0 && s < o) {
      const saved = o - s;
      const pct = Math.round((saved / o) * 100);
      return `Save R${saved.toLocaleString()} (${pct}% off)`;
    }
    return form.discount_label;
  };

  const inv = () => {
    qc.invalidateQueries({ queryKey: ["any-promo"] });
    qc.invalidateQueries({ queryKey: ["active-promo"] });
    qc.invalidateQueries({ queryKey: ["active-promo-pricing"] });
  };

  const save = async () => {
    if (!form.title || !form.ends_at) return toast.error("Title and end date required");
    const payload = {
      title: form.title, description: form.description, discount_label: form.discount_label,
      ends_at: new Date(form.ends_at).toISOString(), is_active: form.is_active,
      package_id: form.package_id || null, package_name: form.package_name || null,
      package_category: form.package_category || null,
      original_price: form.original_price ? Number(form.original_price) : null,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      promo_code: null,
    };
    const { error } = promo
      ? await supabase.from("promotions").update(payload).eq("id", promo.id)
      : await supabase.from("promotions").insert(payload);
    if (error) toast.error(error.message); else { toast.success("Promotion saved ✓"); inv(); }
  };

  const remove = async () => {
    if (!promo || !confirm("Delete promotion?")) return;
    await supabase.from("promotions").delete().eq("id", promo.id); inv();
  };

  const savings = form.original_price && form.sale_price ? Number(form.original_price) - Number(form.sale_price) : 0;

  return (
    <div className="mt-8 panel p-6 max-w-2xl">
      <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Tag size={18} /> Sale promotion</h2>
      <div className="space-y-3">
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="Banner title (e.g. Weekend Special 🔥)" className="bg-input border border-border rounded px-3 py-2 text-sm w-full" />
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Short description shown in banner" rows={2} className="bg-input border border-border rounded px-3 py-2 text-sm w-full" />
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Discount label <span className="text-primary">(auto-filled from prices)</span></div>
            <input value={form.discount_label} onChange={e => setForm({ ...form, discount_label: e.target.value })}
              placeholder="e.g. Save R1500 (20% off)" className="bg-input border border-border rounded px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Ends at</div>
            <input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })}
              className="bg-input border border-border rounded px-3 py-2 text-sm w-full" />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1.5 font-medium">Link to a specific package</div>
          <select value={form.package_id} onChange={e => {
            const pkg = (packages as any[]).find((p: any) => p.id === e.target.value);
            setForm({ ...form, package_id: e.target.value, package_name: pkg?.name ?? "", package_category: pkg?.category ?? "", original_price: pkg ? String(pkg.price) : form.original_price });
          }} className="bg-input border border-border rounded px-3 py-2 text-sm w-full">
            <option value="">— No package link —</option>
            {(packages as any[]).map((p: any) => (
              <option key={p.id} value={p.id}>{p.category} › {p.name} — R{Number(p.price).toLocaleString()}</option>
            ))}
          </select>
          {form.package_name && (
            <div className="mt-1.5 text-xs text-primary bg-primary/10 border border-primary/20 rounded px-3 py-2">
              ✓ Banner links to: {form.package_category} › {form.package_name}
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Original price (R)</div>
            <input type="number" value={form.original_price}
              onChange={e => setForm({ ...form, original_price: e.target.value, discount_label: autoLabel(e.target.value, form.sale_price) })}
              placeholder="e.g. 5000" className="bg-input border border-border rounded px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Sale price (R) <span className="text-orange-400">— auto-fills label</span></div>
            <input type="number" value={form.sale_price}
              onChange={e => setForm({ ...form, sale_price: e.target.value, discount_label: autoLabel(form.original_price, e.target.value) })}
              placeholder="e.g. 3500" className="bg-input border border-border rounded px-3 py-2 text-sm w-full text-orange-400 font-semibold" />
          </div>
        </div>
        {savings > 0 && (
          <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <Tag size={14} className="text-orange-400 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-orange-400">R{savings.toLocaleString()} saving</span>
              <span className="text-muted-foreground"> · {Math.round((savings / Number(form.original_price)) * 100)}% off</span>
              <span className="text-muted-foreground"> · Label auto-filled ✓</span>
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
          Active (shows on website)
        </label>
        <div className="flex gap-2">
          <button onClick={save} className="btn-lime px-5 py-2.5 rounded text-sm font-semibold">
            {promo ? "Update promotion" : "Create promotion"}
          </button>
          {promo && (
            <button onClick={remove} className="px-4 py-2 rounded text-sm text-destructive border border-destructive/40 hover:bg-destructive/10 inline-flex items-center gap-1">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reviews Tab ──
function ReviewsTab({ testimonials, qc }: { testimonials: any[]; qc: any }) {
  const refresh = () => qc.invalidateQueries({ queryKey: ["all-testimonials"] });
  const approve = async (id: string) => { await supabase.from("testimonials").update({ is_approved: true }).eq("id", id); refresh(); toast.success("Approved"); };
  const remove = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("testimonials").delete().eq("id", id); refresh(); };
  const pending = testimonials.filter((t: any) => t.is_approved === false);
  const approved = testimonials.filter((t: any) => t.is_approved !== false);

  return (
    <div className="mt-8 space-y-6">
      <div className="panel p-6">
        <h2 className="font-display text-xl font-bold mb-4"><Star size={18} className="inline mr-2" />Pending ({pending.length})</h2>
        {pending.length === 0 ? <Empty /> : (
          <div className="space-y-3">
            {pending.map((t: any) => (
              <div key={t.id} className="p-4 rounded-lg bg-secondary/40 border border-border flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t.client_name}</span>
                    <div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_: any, i: number) => <Star key={i} size={11} className="fill-primary text-primary" />)}</div>
                  </div>
                  {t.title && <div className="text-sm font-medium mt-0.5">{t.title}</div>}
                  <p className="text-sm text-muted-foreground mt-1">"{t.quote}"</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => approve(t.id)} className="btn-lime px-3 py-1.5 rounded text-xs font-semibold">Approve</button>
                  <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="panel p-6">
        <h2 className="font-display text-xl font-bold mb-4">Live reviews ({approved.length})</h2>
        {approved.length === 0 ? <Empty /> : (
          <div className="grid md:grid-cols-2 gap-3">
            {approved.map((t: any) => (
              <div key={t.id} className="p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{t.client_name}</span>
                    <div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_: any, i: number) => <Star key={i} size={10} className="fill-primary text-primary" />)}</div>
                  </div>
                  <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">"{t.quote}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── WhatsApp Message Menu ──
export function WhatsAppMessageMenu({ booking }: { booking: BookingForTemplate & { id: string; client_whatsapp?: string | null } }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ label: string; text: string } | null>(null);

  const buildText = (template: any) => {
    let text = template.build(booking, { galleryUrl: `${window.location.origin}/dashboard` }).replace("{BOOKING_ID}", booking.id);
    text = text.replace(/1234567890/g, BANK.number).replace(/Trope Photography/g, BANK.account).replace(/Standard Bank/gi, BANK.name);
    return text;
  };

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(o => !o)} className="px-2.5 py-1.5 rounded text-xs border border-border hover:border-primary inline-flex items-center gap-1 bg-secondary/60">
        <MessageCircle size={12} /> Message <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 z-20 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {TEMPLATES.map(t => (
            <button key={t.key} onClick={() => { setPreview({ label: t.label, text: buildText(t) }); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-secondary border-b border-border/50 last:border-0">{t.label}</button>
          ))}
        </div>
      )}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setPreview(null)}>
          <div className="panel p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold">{preview.label}</h3>
              <button onClick={() => setPreview(null)}><X size={16} /></button>
            </div>
            <textarea value={preview.text} onChange={e => setPreview({ ...preview, text: e.target.value })} rows={10}
              className="w-full bg-input border border-border rounded p-3 text-sm font-mono" />
            <div className="flex gap-2 justify-end mt-3">
              <button onClick={() => setPreview(null)} className="text-xs text-muted-foreground px-3 py-2">Cancel</button>
              <a href={waLink(booking.client_whatsapp, preview.text)} target="_blank" rel="noreferrer" onClick={() => setPreview(null)}
                className="btn-lime px-4 py-2 rounded text-xs font-semibold inline-flex items-center gap-1.5">
                <MessageCircle size={12} /> Send via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Deposit Controls ──
export function DepositControls({ booking, onRefresh }: { booking: any; onRefresh: () => void }) {
  const status = booking.deposit_status ?? "awaiting";
  const update = async (next: string) => {
    const patch: any = { deposit_status: next };
    if (next === "deposit_received") patch.deposit_received_at = new Date().toISOString();
    if (next === "fully_paid") patch.fully_paid_at = new Date().toISOString();
    const { error } = await supabase.from("bookings").update(patch).eq("id", booking.id);
    if (error) toast.error(error.message); else { toast.success("Updated"); onRefresh(); }
  };
  const badge = status === "fully_paid" ? "bg-blue-500/20 text-blue-300" : status === "deposit_received" ? "bg-green-500/20 text-green-300" : "bg-orange-500/20 text-orange-300";
  const label = status === "fully_paid" ? "Fully paid" : status === "deposit_received" ? "Deposit received" : "Awaiting payment";
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full inline-flex items-center gap-1 ${badge}`}><CreditCard size={10} /> {label}</span>
      {status === "awaiting" && <button onClick={() => update("deposit_received")} className="text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30">Mark deposit ✓</button>}
      {status === "deposit_received" && <button onClick={() => update("fully_paid")} className="text-[10px] px-2 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">Mark fully paid ✓</button>}
    </div>
  );
}
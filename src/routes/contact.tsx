import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { toast } from "sonner";
import { Mail, Instagram, MessageCircle, Check, ArrowDown, Shield, Star, Camera, Zap } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  whatsapp: z.string().trim().max(40).optional(),
  category: z.string().max(40).optional(),
  package_interest: z.string().max(80).optional(),
  preferred_date: z.string().optional(),
  message: z.string().trim().max(2000).optional(),
});
type FormData = z.infer<typeof schema>;

const CATS = ["Wedding", "Portrait", "Events", "Product", "Maternity", "Kids", "Corporate"];

export const Route = createFileRoute("/contact")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : undefined,
    package: typeof s.package === "string" ? s.package : undefined,
  }),
  head: () => ({ meta: [{ title: "Book a Session — Trope Photography" }] }),
  component: Contact,
});

function Contact() {
  const { user } = useAuth();
  const search = Route.useSearch();

  const { data: packages = [] } = useQuery({
    queryKey: ["packages-active"],
    queryFn: async () => (await supabase.from("packages").select("*").eq("is_active", true).order("category").order("sort_order")).data ?? [],
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: search.category, package_interest: search.package },
  });

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("full_name, email, whatsapp").eq("id", user.id).single().then(({ data }) => {
        if (data) reset({ ...data, category: search.category, package_interest: search.package } as any);
      });
    }
  }, [user, reset, search.category, search.package]);

  const pickPackage = (cat: string, name: string) => {
    setValue("category", cat);
    setValue("package_interest", name);
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSubmit = async (d: FormData) => {
    const { error } = await supabase.from("inquiries").insert({
      ...d,
      user_id: user?.id ?? null,
      status: "new",
      preferred_date: d.preferred_date || null,
    });
    if (error) { toast.error("Couldn't send. Please try again."); return; }
    toast.success("Inquiry sent! I'll be in touch within 24 hours.");
    reset();
  };

  // Group packages by category for the pricing strip
  const grouped = packages.reduce<Record<string, typeof packages>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20">
        <span className="eyebrow">Book a Session</span>
        <h1 className="font-display text-5xl md:text-7xl font-bold mt-3">Choose a package, <span className="text-gradient-warm">we'll do the rest.</span></h1>
        <p className="text-muted-foreground mt-4 max-w-xl">Pick from our offers below — or scroll past and tell us about a custom shoot.</p>

        {/* Pricing strip */}
        <div className="mt-10 space-y-10">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="font-display text-2xl font-bold mb-4">{cat}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {items.map(p => (
                  <div key={p.id} className={`panel p-6 flex flex-col ${p.is_popular ? "border-primary ring-1 ring-primary" : ""}`}>
                    {p.is_popular && <div className="mb-2 text-xs font-semibold text-primary uppercase tracking-widest">Most popular</div>}
                    <div className="font-display text-lg font-bold">{p.name}</div>
                    <div className="mt-2 font-display text-3xl font-bold">
                      R{Number(p.price).toLocaleString()}<span className="text-sm text-muted-foreground font-normal"> / {p.duration}</span>
                    </div>
                    <ul className="mt-4 space-y-1.5 text-sm flex-1">
                      {((p.features as string[]) ?? []).slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={14} className="text-primary shrink-0 mt-1" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => pickPackage(cat, p.name)}
                      className={`mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm ${p.is_popular ? "btn-lime" : "btn-ghost-dark"}`}>
                      Book this <ArrowDown size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {packages.length === 0 && (
            <div className="panel p-6 text-sm text-muted-foreground">
              Packages will appear here. <Link to="/pricing" className="text-primary">See pricing →</Link>
            </div>
          )}
        </div>

        <div id="booking-form" className="mt-16 scroll-mt-24">
          <span className="eyebrow">Tell us about your shoot</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mt-3 mb-8">Send your <span className="text-gradient-warm">inquiry</span></h2>

          <div className="grid lg:grid-cols-3 gap-8">
            <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 panel p-6 lg:p-8 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Full name" error={errors.name?.message}>
                  <input {...register("name")} className="input" />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <input type="email" {...register("email")} className="input" />
                </Field>
                <Field label="WhatsApp">
                  <input {...register("whatsapp")} className="input" placeholder="+27 ..." />
                </Field>
                <Field label="Preferred date">
                  <input type="date" {...register("preferred_date")} className="input" />
                </Field>
                <Field label="Category">
                  <select {...register("category")} className="input">
                    <option value="">Choose</option>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Package interest">
                  <input {...register("package_interest")} className="input" placeholder="e.g. Premium" />
                </Field>
              </div>
              <Field label="Message">
                <textarea {...register("message")} rows={5} className="input" placeholder="Tell me about your shoot..." />
              </Field>
              <button disabled={isSubmitting} className="btn-lime px-6 py-3 rounded-md text-sm disabled:opacity-50">
                {isSubmitting ? "Sending..." : "Send inquiry"}
              </button>
            </form>

            <aside className="space-y-4">
              {/* Response time indicator */}
              <div className="panel p-5 bg-gradient-to-br from-primary/10 via-background to-background border-primary/30">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Replies within ~2 hours
                </div>
                <p className="text-sm text-muted-foreground mt-2">Most inquiries get a personal reply the same day. Weekend bookings get priority.</p>
              </div>

              {/* Trust badges */}
              <div className="panel p-5 space-y-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Why book with us</div>
                {[
                  { icon: <Shield size={16} />, label: "Secure deposit & contract" },
                  { icon: <Camera size={16} />, label: "150+ shoots delivered" },
                  { icon: <Star size={16} />, label: "5-star rated by clients" },
                  { icon: <Zap size={16} />, label: "48h preview gallery" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0">{b.icon}</span>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>

              <a href="https://wa.me/2774967968" target="_blank" rel="noreferrer" className="panel p-5 flex items-center gap-3 hover:border-primary transition-colors">
                <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><MessageCircle size={18} /></span>
                <div><div className="text-xs text-muted-foreground">WhatsApp</div><div className="font-semibold text-sm">074 967 968</div></div>
              </a>
              <a href="mailto:hello@tropephotography.com" className="panel p-5 flex items-center gap-3 hover:border-primary transition-colors">
                <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Mail size={18} /></span>
                <div><div className="text-xs text-muted-foreground">Email</div><div className="font-semibold text-sm">hello@tropephotography.com</div></div>
              </a>
              <a href="https://instagram.com/trope_photography_" target="_blank" rel="noreferrer" className="panel p-5 flex items-center gap-3 hover:border-primary transition-colors">
                <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Instagram size={18} /></span>
                <div><div className="text-xs text-muted-foreground">Instagram</div><div className="font-semibold text-sm">@trope_photography_</div></div>
              </a>
            </aside>
          </div>
        </div>
      </section>

      <style>{`
        .input { width:100%; background: var(--input); color: var(--foreground); border:1px solid var(--border); border-radius: var(--radius-md); padding: .65rem .85rem; font-size: .875rem; }
        .input:focus { outline: 2px solid var(--primary); outline-offset: 2px; }
      `}</style>
    </Layout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1.5 font-medium">{label}</div>
      {children}
      {error && <div className="text-xs text-destructive mt-1">{error}</div>}
    </label>
  );
}

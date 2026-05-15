import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { toast } from "sonner";
import { Mail, Instagram, MessageCircle } from "lucide-react";

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
  head: () => ({ meta: [{ title: "Contact & Booking — Garlo Studio" }] }),
  component: Contact,
});

function Contact() {
  const { user } = useAuth();
  const search = Route.useSearch();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
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

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20">
        <span className="eyebrow">Contact</span>
        <h1 className="font-display text-5xl md:text-7xl font-bold mt-3">Let's <span className="text-gradient-warm">create together.</span></h1>
        <p className="text-muted-foreground mt-4 max-w-xl">Tell me about your session — date, vibe, package. I'll reply within 24 hours.</p>

        <div className="mt-12 grid lg:grid-cols-3 gap-8">
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
            <a href="https://wa.me/27123456789" target="_blank" rel="noreferrer" className="panel p-5 flex items-center gap-3 hover:border-primary transition-colors">
              <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><MessageCircle size={18} /></span>
              <div><div className="text-xs text-muted-foreground">WhatsApp</div><div className="font-semibold text-sm">+27 12 345 6789</div></div>
            </a>
            <a href="mailto:hello@garlostudio.com" className="panel p-5 flex items-center gap-3 hover:border-primary transition-colors">
              <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Mail size={18} /></span>
              <div><div className="text-xs text-muted-foreground">Email</div><div className="font-semibold text-sm">hello@garlostudio.com</div></div>
            </a>
            <a href="https://instagram.com/garlostudio" target="_blank" rel="noreferrer" className="panel p-5 flex items-center gap-3 hover:border-primary transition-colors">
              <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Instagram size={18} /></span>
              <div><div className="text-xs text-muted-foreground">Instagram</div><div className="font-semibold text-sm">@garlostudio</div></div>
            </a>
          </aside>
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

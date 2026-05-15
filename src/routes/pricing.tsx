import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Check, Camera, Users, Briefcase, Baby, Heart, Smile, Package } from "lucide-react";

const ICONS: Record<string, any> = {
  Wedding: Heart, Portrait: Camera, Events: Users, Product: Package,
  Maternity: Baby, Kids: Smile, Corporate: Briefcase,
};

const ORDER = ["Wedding", "Portrait", "Events", "Product", "Maternity", "Kids", "Corporate"];

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — Garlo Studio" }] }),
  component: Pricing,
});

function Pricing() {
  const { data: packages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => (await supabase.from("packages").select("*").eq("is_active", true).order("sort_order")).data ?? [],
  });

  const grouped = ORDER.map(cat => ({ cat, items: packages.filter(p => p.category === cat) })).filter(g => g.items.length > 0);

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 lg:pt-20 text-center">
        <span className="eyebrow inline-flex">Pricing Plan</span>
        <h1 className="font-display text-5xl md:text-7xl font-bold mt-4">
          Transparent pricing —<br /><span className="text-gradient-warm">no hidden costs.</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Choose your session type below. Custom packages available on request.</p>
      </section>

      <div className="max-w-7xl mx-auto px-5 lg:px-8 mt-16 space-y-20">
        {grouped.map(({ cat, items }) => {
          const Icon = ICONS[cat] ?? Camera;
          return (
            <section key={cat}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground grid place-items-center"><Icon size={20} /></div>
                <h2 className="font-display text-3xl md:text-4xl font-bold">{cat} <span className="text-muted-foreground font-normal text-xl">photography</span></h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {items.map(p => (
                  <div key={p.id} className={`panel p-7 flex flex-col ${p.is_popular ? "border-primary ring-1 ring-primary" : ""}`}>
                    {p.is_popular && <div className="mb-3 text-xs font-semibold text-primary uppercase tracking-widest">Most popular</div>}
                    <div className="font-display text-xl font-bold">{p.name}</div>
                    <div className="mt-3 font-display text-5xl font-bold">
                      R{Number(p.price).toLocaleString()}<span className="text-base text-muted-foreground font-normal"> / {p.duration}</span>
                    </div>
                    <ul className="mt-6 space-y-2 text-sm flex-1">
                      {(p.features as string[]).map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={16} className="text-primary shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/contact"
                      search={{ category: cat, package: p.name } as any}
                      className={`mt-6 text-center px-5 py-3 rounded-md text-sm ${p.is_popular ? "btn-lime" : "btn-ghost-dark"}`}
                    >
                      Book this package
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="max-w-2xl mx-auto text-center text-sm text-muted-foreground mt-20 px-5">
        All prices include VAT. Travel outside 30km billed separately. Custom packages available — just ask.
      </p>
    </Layout>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AuthShell, GoogleButton, Divider } from "@/components/AuthShell";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { ShoppingBag, ShieldCheck } from "lucide-react";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
type Mode = "customer" | "admin";

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [{ title: "Sign in — TANN Photography" }] }),
  component: SignIn,
});

function SignIn() {
  const nav = useNavigate();
  const { user, isAdmin } = useAuth();
  const [mode, setMode] = useState<Mode>("customer");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { if (user) nav({ to: isAdmin ? "/admin" : "/dashboard" }); }, [user, isAdmin, nav]);

  const onSubmit = async (d: z.infer<typeof schema>) => {
    const { data, error } = await supabase.auth.signInWithPassword(d);
    if (error) { toast.error(error.message); return; }
    if (mode === "admin" && data.user) {
      const { data: roleRow } = await supabase
        .from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
      if (!roleRow) {
        await supabase.auth.signOut();
        toast.error("This account does not have admin access.");
        return;
      }
      toast.success("Welcome back, admin");
      nav({ to: "/admin" });
      return;
    }
    toast.success("Welcome back");
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Couldn't sign in with Google");
  };

  const isCustomer = mode === "customer";

  return (
    <AuthShell
      title={isCustomer ? "Customer sign in" : "Admin sign in"}
      subtitle={isCustomer ? "Book sessions and manage your gallery." : "Restricted area — admin credentials required."}
      footer={isCustomer ? <>Don't have an account? <Link to="/sign-up" className="text-primary">Sign up</Link></> : <>Not an admin? <button onClick={() => setMode("customer")} className="text-primary">Customer sign in</button></>}
    >
      {/* Mode switcher */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-secondary/60 border border-border mb-6">
        <button
          type="button"
          onClick={() => setMode("customer")}
          className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${isCustomer ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ShoppingBag size={14} /> Customer
        </button>
        <button
          type="button"
          onClick={() => setMode("admin")}
          className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${!isCustomer ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ShieldCheck size={14} /> Admin
        </button>
      </div>

      {isCustomer && (
        <>
          <GoogleButton onClick={google} label="Continue with Google" />
          <Divider text="or sign in with email" />
        </>
      )}

      {!isCustomer && (
        <div className="mb-4 p-3 rounded-md border border-primary/30 bg-primary/5 text-xs text-muted-foreground flex gap-2">
          <ShieldCheck size={14} className="text-primary mt-0.5 shrink-0" />
          <span>Admin access is granted manually. If you're a customer, switch to the Customer tab above.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input {...register("email")} className="input" placeholder={isCustomer ? "Email" : "Admin email"} type="email" />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <input {...register("password")} className="input" placeholder="Password" type="password" />
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">Forgot password?</Link>
        </div>
        <button disabled={isSubmitting} className="w-full btn-lime px-4 py-2.5 rounded-md text-sm disabled:opacity-50">
          {isSubmitting ? "Signing in..." : isCustomer ? "Sign in" : "Sign in as admin"}
        </button>
      </form>
    </AuthShell>
  );
}

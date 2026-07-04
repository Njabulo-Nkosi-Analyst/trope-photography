import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [{ title: "Sign in — Tann Media" }] }),
  component: SignIn,
});

async function routeForUser(userId: string): Promise<"/admin" | "/dashboard"> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return data ? "/admin" : "/dashboard";
}

function SignIn() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!user) return;
    routeForUser(user.id).then(to => nav({ to, replace: true }));
  }, [user, nav]);

  const onSubmit = async (d: z.infer<typeof schema>) => {
    const { data, error } = await supabase.auth.signInWithPassword(d);
    if (error) { toast.error(error.message); return; }
    if (!data.user) { toast.error("Could not sign in"); return; }
    const to = await routeForUser(data.user.id);
    toast.success(to === "/admin" ? "Welcome back, admin" : "Welcome back");
    nav({ to, replace: true });
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your bookings, favourites and session history."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/sign-up" className="text-primary hover:underline">Sign up</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            {...register("email")}
            className="input"
            placeholder="Email"
            type="email"
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <input
            {...register("password")}
            className="input"
            placeholder="Password"
            type="password"
            autoComplete="current-password"
          />
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Forgot password?
          </Link>
        </div>
        <button
          disabled={isSubmitting}
          className="w-full btn-lime px-4 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <style>{`.input{width:100%;background:var(--input);color:var(--foreground);border:1px solid var(--border);border-radius:var(--radius-md);padding:.65rem .85rem;font-size:.875rem}.input:focus{outline:2px solid var(--primary);outline-offset:2px}`}</style>
    </AuthShell>
  );
}
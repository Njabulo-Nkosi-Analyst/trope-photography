import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AuthShell, GoogleButton, Divider } from "@/components/AuthShell";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [{ title: "Sign in — TANN Photography" }] }),
  component: SignIn,
});

function SignIn() {
  const nav = useNavigate();
  const { user, isAdmin } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => { if (user) nav({ to: isAdmin ? "/admin" : "/dashboard" }); }, [user, isAdmin, nav]);

  const onSubmit = async (d: z.infer<typeof schema>) => {
    const { error } = await supabase.auth.signInWithPassword(d);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back");
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Couldn't sign in with Google");
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your bookings." footer={<>Don't have an account? <Link to="/sign-up" className="text-primary">Sign up</Link></>}>
      <GoogleButton onClick={google} label="Continue with Google" />
      <Divider text="or sign in with email" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input {...register("email")} className="input" placeholder="Email" type="email" />
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
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

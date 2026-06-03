import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AuthShell, GoogleButton, Divider } from "@/components/AuthShell";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6),
  confirm: z.string().min(6),
  terms: z.literal(true, { errorMap: () => ({ message: "Please accept the terms" }) }),
}).refine(d => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

export const Route = createFileRoute("/sign-up")({
  head: () => ({ meta: [{ title: "Create account — Trope Photography" }] }),
  component: SignUp,
});

function SignUp() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (d: z.infer<typeof schema>) => {
    const { error } = await supabase.auth.signUp({
      email: d.email,
      password: d.password,
      options: { data: { full_name: d.full_name }, emailRedirectTo: window.location.origin + "/dashboard" },
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Account created — check your email to confirm.");
    nav({ to: "/sign-in" });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Couldn't sign in with Google");
  };

  return (
    <AuthShell title="Create your account" subtitle="Save your favourites and re-book in one click." footer={<>Already have an account? <Link to="/sign-in" className="text-primary">Sign in</Link></>}>
      <GoogleButton onClick={google} label="Continue with Google" />
      <Divider text="or create an account" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input {...register("full_name")} className="input" placeholder="Full name" />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
        <input {...register("email")} type="email" className="input" placeholder="Email" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        <input {...register("password")} type="password" className="input" placeholder="Password" />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        <input {...register("confirm")} type="password" className="input" placeholder="Confirm password" />
        {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" {...register("terms")} className="mt-0.5" />
          <span>I agree to the terms & privacy policy.</span>
        </label>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms.message as string}</p>}
        <button disabled={isSubmitting} className="w-full btn-lime px-4 py-2.5 rounded-md text-sm disabled:opacity-50">
          {isSubmitting ? "Creating..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

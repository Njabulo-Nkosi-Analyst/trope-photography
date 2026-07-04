import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(1, "Name required").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string().min(6),
  terms: z.literal(true, { errorMap: () => ({ message: "Please accept the terms" }) }),
}).refine(d => d.password === d.confirm, {
  path: ["confirm"],
  message: "Passwords don't match",
});

export const Route = createFileRoute("/sign-up")({
  head: () => ({ meta: [{ title: "Create account — Tann Media" }] }),
  component: SignUp,
});

function SignUp() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (d: z.infer<typeof schema>) => {
    const { error } = await supabase.auth.signUp({
      email: d.email,
      password: d.password,
      options: {
        data: { full_name: d.full_name },
        emailRedirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Account created — check your email to confirm.");
    nav({ to: "/sign-in" });
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save your favourites and re-book in one click."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/sign-in" className="text-primary hover:underline">Sign in</Link>
        </>
      }
    >
      {/* Back button */}
      <button
        type="button"
        onClick={() => nav({ to: "/sign-in" })}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft size={13} /> Back to sign in
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            {...register("full_name")}
            className="input"
            placeholder="Full name"
            autoComplete="name"
          />
          {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name.message}</p>}
        </div>
        <div>
          <input
            {...register("email")}
            type="email"
            className="input"
            placeholder="Email"
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <input
            {...register("password")}
            type="password"
            className="input"
            placeholder="Password"
            autoComplete="new-password"
          />
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <input
            {...register("confirm")}
            type="password"
            className="input"
            placeholder="Confirm password"
            autoComplete="new-password"
          />
          {errors.confirm && <p className="text-xs text-destructive mt-1">{errors.confirm.message}</p>}
        </div>
        <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" {...register("terms")} className="mt-0.5 accent-primary" />
          <span>I agree to the terms &amp; privacy policy.</span>
        </label>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms.message as string}</p>}
        <button
          disabled={isSubmitting}
          className="w-full btn-lime px-4 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50">
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <style>{`.input{width:100%;background:var(--input);color:var(--foreground);border:1px solid var(--border);border-radius:var(--radius-md);padding:.65rem .85rem;font-size:.875rem}.input:focus{outline:2px solid var(--primary);outline-offset:2px}`}</style>
    </AuthShell>
  );
}
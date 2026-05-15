import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "New password — Garlo Studio" }] }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting }, watch } = useForm<{ password: string; confirm: string }>();

  const onSubmit = async (d: { password: string; confirm: string }) => {
    if (d.password !== d.confirm) { toast.error("Passwords don't match"); return; }
    const { error } = await supabase.auth.updateUser({ password: d.password });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    nav({ to: "/sign-in" });
  };

  return (
    <AuthShell title="Set a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input type="password" {...register("password", { required: true, minLength: 6 })} className="input" placeholder="New password" />
        <input type="password" {...register("confirm", { required: true, validate: v => v === watch("password") || "Passwords don't match" })} className="input" placeholder="Confirm password" />
        <button disabled={isSubmitting} className="w-full btn-lime px-4 py-2.5 rounded-md text-sm disabled:opacity-50">Update password</button>
      </form>
    </AuthShell>
  );
}

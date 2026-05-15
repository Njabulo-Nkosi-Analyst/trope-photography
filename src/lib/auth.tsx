import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null, user: null, loading: true, isAdmin: false, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(async () => {
          const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id).eq("role", "admin").maybeSingle();
          setIsAdmin(!!data);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", data.session.user.id).eq("role", "admin").maybeSingle()
          .then(({ data: r }) => setIsAdmin(!!r));
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{
      session, user: session?.user ?? null, loading, isAdmin,
      signOut: async () => { await supabase.auth.signOut(); },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

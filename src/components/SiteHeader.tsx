import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sprout, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <Sprout className="h-6 w-6" />
          <span>SmartShield</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link to="/architecture" className="px-2 py-1 hover:text-primary" activeProps={{ className: "px-2 py-1 text-primary font-semibold" }}>Architecture</Link>
          <Link to="/documentation" className="px-2 py-1 hover:text-primary" activeProps={{ className: "px-2 py-1 text-primary font-semibold" }}>Docs</Link>
          {email ? (
            <>
              <Link to="/dashboard" className="px-2 py-1 hover:text-primary" activeProps={{ className: "px-2 py-1 text-primary font-semibold" }}>Dashboard</Link>
              <Link to="/reports" className="px-2 py-1 hover:text-primary" activeProps={{ className: "px-2 py-1 text-primary font-semibold" }}>Reports</Link>
              <Link to="/admin" className="px-2 py-1 hover:text-primary" activeProps={{ className: "px-2 py-1 text-primary font-semibold" }}>Admin</Link>
              <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Link to="/auth" className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

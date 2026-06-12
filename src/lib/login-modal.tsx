import { createContext, useContext, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

type Ctx = {
  /** Returns true if user is already signed in. Otherwise opens modal and returns false. */
  requireLogin: () => boolean;
  openLogin: () => void;
};

const C = createContext<Ctx | null>(null);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const { user, login } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const requireLogin = () => {
    if (user) return true;
    setOpen(true);
    return false;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      setOpen(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <C.Provider value={{ requireLogin, openLogin: () => setOpen(true) }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto h-11 w-11 rounded-xl bg-primary grid place-items-center text-primary-foreground mb-2">
              <GraduationCap className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">Sign in to CA Hub</DialogTitle>
            <DialogDescription className="text-center">
              Save your progress, notes, and mistakes across devices.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="lm-email">Email</Label>
              <Input
                id="lm-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lm-pass">Password</Label>
              <PasswordInput
                id="lm-pass"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </DialogFooter>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/auth" className="text-primary hover:underline" onClick={() => setOpen(false)}>
              Create an account
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </C.Provider>
  );
}

export function useLoginModal() {
  const v = useContext(C);
  if (!v) throw new Error("useLoginModal requires LoginModalProvider");
  return v;
}

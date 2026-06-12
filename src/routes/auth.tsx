import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { GraduationCap, Upload } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const { user, login, register, requestPasswordReset, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup
  const [name, setName] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);

  // Forgot
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (email !== emailConfirm) throw new Error("Emails do not match");
        if (password !== passwordConfirm) throw new Error("Passwords do not match");
        if (password.length < 8) throw new Error("Password must be at least 8 characters");

        const fd = new FormData();
        fd.append("email", email);
        fd.append("emailVisibility", "true");
        fd.append("password", password);
        fd.append("passwordConfirm", passwordConfirm);
        fd.append("name", name || email.split("@")[0]);
        if (avatar) fd.append("avatar", avatar);
        await register(fd);
      }
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotBusy(true);
    try {
      await requestPasswordReset(forgotEmail);
      toast.success("Reset link sent — check your email");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send reset email";
      toast.error(msg);
    } finally {
      setForgotBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-[oklch(0.42_0.08_265)] text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center backdrop-blur">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight text-lg">CA Hub</span>
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Your calm, classy command center for CA prep.
          </h1>
          <p className="text-white/75 text-base leading-relaxed">
            Track syllabus, capture notes, log mistakes, run focus sessions — and chat with an AI
            tutor that knows your context.
          </p>
        </div>
        <p className="text-xs text-white/50">Built for serious students. Privacy-first.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary grid place-items-center text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight text-lg">CA Hub</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login"
              ? "Sign in to continue your prep."
              : "Start your CA journey in seconds."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="emailConfirm">Confirm email</Label>
                <Input
                  id="emailConfirm"
                  type="email"
                  required
                  value={emailConfirm}
                  onChange={(e) => setEmailConfirm(e.target.value)}
                  placeholder="Re-enter your email"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirm">Confirm password</Label>
                  <PasswordInput
                    id="passwordConfirm"
                    required
                    minLength={8}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="avatar">Avatar (optional)</Label>
                  <label
                    htmlFor="avatar"
                    className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-transparent text-sm text-muted-foreground cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="truncate">
                      {avatar ? avatar.name : "Choose an image"}
                    </span>
                  </label>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
                  />
                </div>
              </>
            )}
            <Button type="submit" disabled={busy} className="w-full h-10">
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotOpen(true);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter the email tied to your CA Hub account and we'll send a reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sendReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgotEmail">Email</Label>
              <Input
                id="forgotEmail"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotOpen(false)}
                disabled={forgotBusy}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={forgotBusy}>
                {forgotBusy ? "Sending…" : "Send reset link"}
              </Button>
            </DialogFooter>
          </form>
          <p className="text-xs text-muted-foreground text-center">
            Have a reset token?{" "}
            <Link to="/reset-password" className="text-primary hover:underline">
              Open reset page
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { toast } from "sonner";
import { GraduationCap, KeyRound } from "lucide-react";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  validateSearch: searchSchema,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token: searchToken } = Route.useSearch();
  const { confirmPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [token, setToken] = useState(searchToken ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Missing reset token");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== passwordConfirm) return toast.error("Passwords do not match");

    setBusy(true);
    try {
      await confirmPasswordReset(token, password, passwordConfirm);
      toast.success("Password updated — please sign in");
      navigate({ to: "/auth", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-background">
      <div className="w-full max-w-sm card-soft p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight text-lg">CA Hub</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {searchToken
            ? "Choose a strong password to finish resetting your account."
            : "Paste the token from your reset email and choose a new password."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {!searchToken && (
            <div className="space-y-1.5">
              <Label htmlFor="token">Reset token</Label>
              <input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
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
          <Button type="submit" disabled={busy} className="w-full h-10">
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

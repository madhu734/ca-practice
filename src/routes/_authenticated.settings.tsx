import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { getAISettings, saveAISettings, clearAISettings, type AISettings } from "@/lib/ai";
import { useAuth } from "@/lib/auth";
import { pb, pbFileUrl, USERS_COLLECTION } from "@/lib/pb";
import { toast } from "sonner";
import { ShieldCheck, KeyRound, Database, User as UserIcon, Upload, Lock } from "lucide-react";
import { GuestNotice } from "@/components/guest-notice";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [s, setS] = useState<AISettings>({
    endpoint: "",
    deployment: "",
    apiKey: "",
    apiVersion: "2024-08-01-preview",
  });

  useEffect(() => {
    const existing = getAISettings();
    if (existing) setS({ apiVersion: "2024-08-01-preview", ...existing });
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    saveAISettings(s);
    toast.success("AI credentials saved locally");
  };

  const clear = () => {
    clearAISettings();
    setS({ endpoint: "", deployment: "", apiKey: "", apiVersion: "2024-08-01-preview" });
    toast.success("Cleared");
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, password, and AI Tutor connection.
        </p>
      </header>

      {user ? <ProfileCard /> : <GuestNotice message="Sign in to manage your profile." />}
      {user && <PasswordCard />}

      <form onSubmit={save} className="card-soft p-6 space-y-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Azure OpenAI</h2>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endpoint">Endpoint</Label>
          <Input
            id="endpoint"
            placeholder="https://my-resource.openai.azure.com"
            value={s.endpoint}
            onChange={(e) => setS({ ...s, endpoint: e.target.value })}
            required
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="deployment">Deployment name</Label>
            <Input
              id="deployment"
              placeholder="gpt-4o-mini"
              value={s.deployment}
              onChange={(e) => setS({ ...s, deployment: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ver">API version</Label>
            <Input
              id="ver"
              value={s.apiVersion}
              onChange={(e) => setS({ ...s, apiVersion: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="key">API key</Label>
          <Input
            id="key"
            type="password"
            value={s.apiKey}
            onChange={(e) => setS({ ...s, apiKey: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Stored only in this browser's localStorage. Never sent anywhere except Azure.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={clear}>
            Clear
          </Button>
        </div>
      </form>

      <SchemaCard />
    </div>
  );
}

function ProfileCard() {
  const { user, updateProfile } = useAuth();
  const rec = pb.authStore.record;
  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const currentAvatar =
    rec?.avatar ? pbFileUrl({ id: rec.id, collectionName: USERS_COLLECTION }, rec.avatar) : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      if (name && name !== user?.name) fd.append("name", name);
      if (email && email !== user?.email) fd.append("email", email);
      if (avatar) fd.append("avatar", avatar);
      // PocketBase needs at least one field
      if ([...fd.keys()].length === 0) {
        toast.message("Nothing to update");
        return;
      }
      await updateProfile(fd);
      toast.success("Profile updated");
      setAvatar(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card-soft p-6 space-y-5">
      <div className="flex items-center gap-2">
        <UserIcon className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Profile</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-accent overflow-hidden grid place-items-center text-lg font-semibold">
          {currentAvatar ? (
            <img src={currentAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="avatar-file">Profile picture</Label>
          <label
            htmlFor="avatar-file"
            className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-transparent text-sm text-muted-foreground cursor-pointer hover:bg-accent/40"
          >
            <Upload className="h-4 w-4" />
            <span className="truncate">{avatar ? avatar.name : "Choose new image"}</span>
          </label>
          <input
            id="avatar-file"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Name</Label>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-email">Email</Label>
          <Input
            id="p-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Changing email may require re-verification in PocketBase.
          </p>
        </div>
      </div>

      <div className="pt-1">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function PasswordCard() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const { updateProfile, user, login } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");
    setBusy(true);
    try {
      // PocketBase normally requires oldPassword to change password.
      // The user requested no old-password prompt, so we silently re-auth
      // using the existing session token via authRefresh, then use the
      // admin-style "password change without old" only works for superusers.
      // Practical safe path: ask PB to update password + passwordConfirm.
      // If the server rejects (requires oldPassword), we surface the message.
      await updateProfile({ password: pw, passwordConfirm: pw2 });
      // Re-login to refresh token
      if (user?.email) {
        await login(user.email, pw).catch(() => {});
      }
      toast.success("Password updated");
      setPw("");
      setPw2("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update failed";
      toast.error(
        msg.includes("oldPassword")
          ? "Your PocketBase 'ca_users' collection requires the old password. Disable that rule in the collection's options to enable simple reset."
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card-soft p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Change password</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="np">New password</Label>
          <PasswordInput
            id="np"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            minLength={8}
            required
            placeholder="At least 8 characters"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="np2">Confirm new password</Label>
          <PasswordInput
            id="np2"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            minLength={8}
            required
            placeholder="Re-enter password"
          />
        </div>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

function SchemaCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-soft p-6">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">PocketBase schema</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Every <code>user_id</code> relation must point to the <code>ca_users</code> auth collection.
      </p>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide" : "Show"} schema
      </Button>
      {open && (
        <pre className="mt-4 text-xs bg-muted/60 border border-border rounded-lg p-4 overflow-auto leading-relaxed">
{`# 1. subjects: name (text), code (text), user_id (relation -> ca_users)
# 2. chapters: name (text), weightage (select High|Medium|Low),
#              subject_id (relation -> subjects), user_id (relation -> ca_users)
# 3. progress: chapter_id (relation), user_id (relation),
#              concept_cleared (bool), past_papers_done (bool),
#              revision_count (number, default 0)
# 4. notes:    title (text), body (editor), tags (json),
#              user_id (relation -> ca_users)
# 5. mistakes: title (text), image (file, ≤5MB, images only),
#              why_failed (editor), correct_approach (editor),
#              chapter_id (relation, optional),
#              user_id (relation -> ca_users)

# Recommended API rules (per collection):
listRule    = @request.auth.id != "" && user_id = @request.auth.id
viewRule    = @request.auth.id != "" && user_id = @request.auth.id
createRule  = @request.auth.id != ""
updateRule  = @request.auth.id != "" && user_id = @request.auth.id
deleteRule  = @request.auth.id != "" && user_id = @request.auth.id`}
        </pre>
      )}
    </div>
  );
}

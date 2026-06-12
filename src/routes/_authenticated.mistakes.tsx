import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { pb, pbFileUrl } from "@/lib/pb";
import { useLoginModal } from "@/lib/login-modal";
import { GuestNotice } from "@/components/guest-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Plus, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mistakes")({
  component: MistakesPage,
});

type Mistake = {
  id: string;
  title: string;
  image?: string;
  why_failed: string;
  correct_approach: string;
  chapter_id?: string;
  user_id: string;
  collectionId: string;
  collectionName: string;
};

type Chapter = { id: string; name: string };

const MAX_BYTES = 5 * 1024 * 1024;

function MistakesPage() {
  const { user, loading: authLoading } = useAuth();
  const { requireLogin, openLogin } = useLoginModal();
  const [list, setList] = useState<Mistake[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Mistake | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [correct, setCorrect] = useState("");
  const [chapterId, setChapterId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) {
      setList([]);
      setChapters([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const filter = `user_id = "${user.id}"`;
      const [items, chs] = await Promise.all([
        pb.collection("mistakes").getFullList<Mistake>({ filter, sort: "-created" }),
        pb.collection("chapters").getFullList<Chapter>({ filter, sort: "name" }).catch(() => []),
      ]);
      setList(items);
      setChapters(chs);
    } catch (e: any) {
      console.error(e);
      if (e?.status === 403) {
        toast.error("PocketBase 403 Forbidden: Please unlock API Rules for 'mistakes' & 'chapters' and click 'Save changes' in PocketBase Admin.");
      } else {
        toast.error("Could not load mistakes. Check the mistakes collection in PocketBase.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const resetForm = () => {
    setTitle("");
    setWhy("");
    setCorrect("");
    setChapterId("");
    setFile(null);
  };

  const startNew = () => {
    if (!requireLogin()) return;
    resetForm();
    setOpen(true);
  };

  const save = async () => {
    if (!requireLogin() || !user) return;
    if (!title.trim()) return toast.error("Add a title");
    if (file && file.size > MAX_BYTES) return toast.error("Image must be ≤ 5MB");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("why_failed", why);
      fd.append("correct_approach", correct);
      if (chapterId) fd.append("chapter_id", chapterId);
      fd.append("user_id", user.id);
      if (file) fd.append("image", file);
      const created = await pb.collection("mistakes").create<Mistake>(fd);
      setList((prev) => [created, ...prev]);
      setOpen(false);
      resetForm();
      toast.success("Mistake logged");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this mistake?")) return;
    try {
      await pb.collection("mistakes").delete(id);
      setList((prev) => prev.filter((m) => m.id !== id));
      setActive(null);
    } catch {
      toast.error("Delete failed");
    }
  };

  const chapterName = useMemo(
    () => Object.fromEntries(chapters.map((c) => [c.id, c.name])),
    [chapters],
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Mistake Log</h1>
          <p className="text-muted-foreground mt-1">
            Snapshot mistakes from your notebook, log why and how to fix them.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startNew}>
              <Plus className="h-4 w-4" /> Log mistake
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New mistake</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-title">Title</Label>
                <Input
                  id="m-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Misapplied Sec 44AD threshold"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-img">Screenshot (≤ 5MB)</Label>
                <label
                  htmlFor="m-img"
                  className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-transparent text-sm text-muted-foreground cursor-pointer hover:bg-accent/40"
                >
                  <Upload className="h-4 w-4" />
                  <span className="truncate">{file ? file.name : "Choose an image"}</span>
                </label>
                <input
                  id="m-img"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-why">Why I failed</Label>
                <Textarea
                  id="m-why"
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  className="min-h-24"
                  placeholder="What confused me / what assumption was wrong"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-fix">Correct approach</Label>
                <Textarea
                  id="m-fix"
                  value={correct}
                  onChange={(e) => setCorrect(e.target.value)}
                  className="min-h-24"
                  placeholder="The right method / rule / formula"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-ch">Linked chapter (optional)</Label>
                <select
                  id="m-ch"
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">— none —</option>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={busy}>
                  {busy ? "Saving…" : "Save mistake"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {!user && <GuestNotice message="Sign in to keep a private log of mistakes per chapter." />}

      {authLoading || loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <div className="card-soft p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-warning/30 text-warning-foreground grid place-items-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {!user
              ? "Sign in to keep a private log of mistakes."
              : "No mistakes logged yet. That's the perfect time to start."}
          </p>
          {!user && (
            <Button className="mt-4 cursor-pointer" onClick={openLogin}>
              Sign in to log mistakes
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((m) => {
            const url = m.image ? pbFileUrl(m, m.image) : "";
            return (
              <button
                key={m.id}
                onClick={() => setActive(m)}
                className="card-lift text-left overflow-hidden group"
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {url ? (
                    <img
                      src={url}
                      alt={m.title}
                      className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform"
                    />
                  ) : (
                    <div className="h-full grid place-items-center text-muted-foreground">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="font-medium truncate">{m.title}</div>
                  {m.chapter_id && chapterName[m.chapter_id] && (
                    <div className="text-[11px] text-muted-foreground mt-1 truncate">
                      {chapterName[m.chapter_id]}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-4">
              {active.image && (
                <img
                  src={pbFileUrl(active, active.image)}
                  alt={active.title}
                  className="w-full max-h-[50vh] object-contain rounded-lg border border-border bg-muted"
                />
              )}
              <Section title="Why I failed" body={active.why_failed} />
              <Section title="Correct approach" body={active.correct_approach} />
              {active.chapter_id && chapterName[active.chapter_id] && (
                <p className="text-xs text-muted-foreground">
                  Chapter: {chapterName[active.chapter_id]}
                </p>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => del(active.id)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      <div className="text-sm whitespace-pre-wrap leading-relaxed">{body}</div>
    </div>
  );
}

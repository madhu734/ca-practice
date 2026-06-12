import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { pb } from "@/lib/pb";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  NotebookPen,
  Plus,
  Search,
  Save,
  Trash2,
  Sparkles,
  Baby,
  ListChecks,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { chatComplete, getAISettings } from "@/lib/ai";

export const Route = createFileRoute("/_authenticated/knowledge")({
  component: KnowledgePage,
});

type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[] | string;
  user_id: string;
  updated: string;
};

function KnowledgePage() {
  const { user, loading: authLoading } = useAuth();
  const { requireLogin } = useLoginModal();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [aiBusy, setAiBusy] = useState<null | "eli5" | "mn" | "sum">(null);
  const [aiResult, setAiResult] = useState<{ title: string; body: string } | null>(null);

  const load = async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await pb
        .collection("notes")
        .getFullList<Note>({ filter: `user_id = "${user.id}"`, sort: "-updated" });
      setNotes(list);
    } catch (e: any) {
      console.error(e);
      if (e?.status === 403) {
        toast.error("PocketBase 403 Forbidden: Please unlock API Rules for 'notes' and click 'Save changes' in PocketBase Admin.");
      } else {
        toast.error("Could not load notes. Check the notes collection in PocketBase.");
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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(s) ||
        (n.body || "").toLowerCase().includes(s) ||
        tagsArray(n.tags).join(" ").toLowerCase().includes(s),
    );
  }, [notes, q]);

  const openNote = (n: Note) => {
    setActiveId(n.id);
    setTitle(n.title);
    setBody(n.body || "");
    setTagsInput(tagsArray(n.tags).join(", "));
  };

  const newNote = () => {
    if (!requireLogin()) return;
    setActiveId(null);
    setTitle("");
    setBody("");
    setTagsInput("");
  };

  const save = async () => {
    if (!requireLogin() || !user) return;
    if (!title.trim()) {
      toast.error("Give your note a title");
      return;
    }
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = { title, body, tags, user_id: user.id };
      if (activeId) {
        const updated = await pb.collection("notes").update<Note>(activeId, payload);
        setNotes((prev) => [updated, ...prev.filter((n) => n.id !== activeId)]);
      } else {
        const created = await pb.collection("notes").create<Note>(payload);
        setNotes((prev) => [created, ...prev]);
        setActiveId(created.id);
      }
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!activeId) return;
    if (!confirm("Delete this note?")) return;
    try {
      await pb.collection("notes").delete(activeId);
      setNotes((prev) => prev.filter((n) => n.id !== activeId));
      newNote();
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const runAI = async (kind: "eli5" | "mn" | "sum") => {
    const src = (body || "").trim();
    if (!src) {
      toast.error("Write some content first");
      return;
    }
    if (!getAISettings()) {
      toast.error("Add Azure OpenAI credentials in Settings");
      return;
    }
    setAiBusy(kind);
    try {
      const sys =
        "You are a tutor for Indian CA students. Output in markdown. Be precise, concise, accurate.";
      const prompt =
        kind === "eli5"
          ? `Explain the following to a 5-year-old using simple analogies. Use 3-6 short bullets.\n\n"""\n${src}\n"""`
          : kind === "mn"
            ? `Create a catchy mnemonic or acronym to remember the key bullet points below. Provide the acronym AND a one-line meaning per letter.\n\n"""\n${src}\n"""`
            : `Summarize the following into 5-8 crisp bullet points capturing all essential ideas.\n\n"""\n${src}\n"""`;
      const reply = await chatComplete([
        { role: "system", content: sys },
        { role: "user", content: prompt },
      ]);
      setAiResult({
        title:
          kind === "eli5"
            ? "Explain like I'm 5"
            : kind === "mn"
              ? "Mnemonic"
              : "Summary",
        body: reply,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setAiBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">
          Capture theory, mnemonics, and AI-distilled notes. Organised by tags.
        </p>
      </header>

      {!user && (
        <GuestNotice message="Sign in to keep a private, searchable notes library." />
      )}

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar list */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notes"
                className="pl-8 h-9"
              />
            </div>
            <Button size="sm" onClick={newNote} className="h-9">
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
          <div className="card-soft p-2 max-h-[60vh] overflow-y-auto">
            {authLoading || loading ? (
              <p className="text-xs text-muted-foreground p-3">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                {user ? "No notes yet." : "Sign in to see your notes."}
              </p>
            ) : (
              filtered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNote(n)}
                  className={[
                    "w-full text-left px-3 py-2 rounded-lg transition-colors",
                    activeId === n.id ? "bg-accent" : "hover:bg-accent/60",
                  ].join(" ")}
                >
                  <div className="text-sm font-medium truncate">{n.title || "Untitled"}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {tagsArray(n.tags).join(" · ") || "untagged"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="card-soft p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sec 80C deductions — quick recap"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Subject / tags</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Direct Tax, deductions, important"
            />
            <p className="text-[11px] text-muted-foreground">Comma-separated.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Body (markdown)</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Use **bold**, _italic_, lists, etc."
              className="min-h-[280px] font-mono text-[13px] leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : activeId ? "Update note" : "Save note"}
            </Button>
            {activeId && (
              <Button variant="outline" onClick={del}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <div className="flex-1" />
            <AIButton busy={aiBusy === "eli5"} onClick={() => runAI("eli5")} icon={<Baby className="h-4 w-4" />}>
              Explain like I'm 5
            </AIButton>
            <AIButton busy={aiBusy === "mn"} onClick={() => runAI("mn")} icon={<Sparkles className="h-4 w-4" />}>
              Mnemonic
            </AIButton>
            <AIButton busy={aiBusy === "sum"} onClick={() => runAI("sum")} icon={<ListChecks className="h-4 w-4" />}>
              Summarize
            </AIButton>
          </div>

          <Preview body={body} />
        </div>
      </div>

      <Dialog open={!!aiResult} onOpenChange={(o) => !o && setAiResult(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> {aiResult?.title}
            </DialogTitle>
            <DialogDescription>Generated by your AI Tutor</DialogDescription>
          </DialogHeader>
          <div className="prose-like max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed bg-muted/40 rounded-lg p-4 border border-border">
            {aiResult?.body}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (aiResult) {
                  navigator.clipboard.writeText(aiResult.body);
                  toast.success("Copied");
                }
              }}
            >
              Copy
            </Button>
            <Button
              onClick={() => {
                if (aiResult) {
                  setBody((b) => (b ? `${b}\n\n---\n## ${aiResult.title}\n${aiResult.body}` : aiResult.body));
                  setAiResult(null);
                  toast.success("Appended to note");
                }
              }}
            >
              Append to note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AIButton({
  busy,
  onClick,
  icon,
  children,
}: {
  busy: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </Button>
  );
}

function Preview({ body }: { body: string }) {
  if (!body.trim()) return null;
  return (
    <div className="border-t border-border pt-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
        <NotebookPen className="h-3.5 w-3.5" /> Preview
      </div>
      <div className="text-sm whitespace-pre-wrap leading-relaxed">{body}</div>
    </div>
  );
}

function tagsArray(t: Note["tags"]): string[] {
  if (Array.isArray(t)) return t;
  if (!t) return [];
  try {
    const parsed = JSON.parse(String(t));
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // not json
  }
  return String(t)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Keep export for siblings importing Placeholder previously
export function Placeholder({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </header>
      <div className="card-soft p-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Silence unused-import warnings for Badge if tree-shaken later
export const _kbBadge = Badge;

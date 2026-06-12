import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { pb } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, RotateCw, FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import { useLoginModal } from "@/lib/login-modal";
import { GuestNotice } from "@/components/guest-notice";

export const Route = createFileRoute("/_authenticated/syllabus")({
  component: SyllabusPage,
});

type Subject = { id: string; name: string; code: string; user_id: string };
type Chapter = {
  id: string;
  name: string;
  weightage: "High" | "Medium" | "Low";
  subject_id: string;
  user_id: string;
};
type Progress = {
  id?: string;
  chapter_id: string;
  user_id: string;
  concept_cleared: boolean;
  past_papers_done: boolean;
  revision_count: number;
};

function SyllabusPage() {
  const { user, loading: authLoading } = useAuth();
  const { requireLogin } = useLoginModal();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const filter = user ? `user_id = "${user.id}"` : undefined;
      const [subs, chs, prog] = await Promise.all([
        pb.collection("subjects").getFullList<Subject>(
          filter ? { filter, sort: "name" } : { sort: "name" }
        ),
        pb.collection("chapters").getFullList<Chapter>(
          filter ? { filter, sort: "created" } : { sort: "created" }
        ),
        user
          ? pb.collection("progress").getFullList<Progress>({ filter })
          : Promise.resolve([]),
      ]);
      setSubjects(subs);
      setChapters(chs);
      const map: Record<string, Progress> = {};
      prog.forEach((p) => (map[p.chapter_id] = p));
      setProgress(map);
    } catch (e: any) {
      console.error(e);
      if (e?.status === 403) {
        toast.error(
          "PocketBase 403 Forbidden: Please unlock API Rules for 'subjects' & 'chapters' in PocketBase Admin and click the blue 'Save changes' button.",
          { duration: 8000 }
        );
      } else {
        toast.error(
          "Couldn't load syllabus. Make sure PocketBase collections exist (see Settings → Schema).",
        );
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

  const upsertProgress = async (chapterId: string, patch: Partial<Progress>) => {
    if (!requireLogin() || !user) return;
    const current = progress[chapterId] ?? {
      chapter_id: chapterId,
      user_id: user.id,
      concept_cleared: false,
      past_papers_done: false,
      revision_count: 0,
    };
    const next = { ...current, ...patch };
    setProgress((p) => ({ ...p, [chapterId]: next }));
    try {
      if (current.id) {
        await pb.collection("progress").update(current.id, patch);
      } else {
        const created = await pb.collection("progress").create(next);
        setProgress((p) => ({ ...p, [chapterId]: { ...next, id: created.id } }));
      }
    } catch (e) {
      toast.error("Couldn't save progress");
      load();
    }
  };

  if (authLoading || loading) {
    return <p className="text-sm text-muted-foreground">Loading syllabus…</p>;
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Syllabus</h1>
          <p className="text-muted-foreground mt-1">
            Track concepts cleared, past papers solved, and revision count.
          </p>
        </div>
      </header>

      {!user && <GuestNotice message="Sign in to track your CA syllabus chapter by chapter." />}

      {subjects.length === 0 ? (
        <div className="card-soft p-10 text-center">
          <p className="text-muted-foreground">
            Your syllabus is empty. Use the button above to seed a starter CA syllabus.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {subjects.map((s) => {
            const subChapters = chapters.filter((c) => c.subject_id === s.id);
            const cleared = subChapters.filter((c) => progress[c.id]?.concept_cleared).length;
            return (
              <section key={s.id}>
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {s.name} <span className="text-muted-foreground font-normal text-sm">· {s.code}</span>
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {cleared}/{subChapters.length} cleared
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {subChapters.map((c) => {
                    const p = progress[c.id];
                    return (
                      <div key={c.id} className="card-soft p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium">{c.name}</div>
                            <div className="mt-1.5">
                              <WeightBadge w={c.weightage || (c as any).select || "Medium"} />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <RotateCw className="h-3.5 w-3.5" />
                            {p?.revision_count ?? 0}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <ToggleChip
                            active={!!p?.concept_cleared}
                            onClick={() =>
                              upsertProgress(c.id, { concept_cleared: !p?.concept_cleared })
                            }
                            icon={<Check className="h-3.5 w-3.5" />}
                            tone="success"
                          >
                            Concept cleared
                          </ToggleChip>
                          <ToggleChip
                            active={!!p?.past_papers_done}
                            onClick={() =>
                              upsertProgress(c.id, { past_papers_done: !p?.past_papers_done })
                            }
                            icon={<FileCheck2 className="h-3.5 w-3.5" />}
                            tone="primary"
                          >
                            Past papers
                          </ToggleChip>
                          <button
                            type="button"
                            onClick={() =>
                              upsertProgress(c.id, { revision_count: (p?.revision_count ?? 0) + 1 })
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border border-border bg-card hover:bg-accent transition-colors"
                          >
                            <RotateCw className="h-3.5 w-3.5" /> +1 revision
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WeightBadge({ w }: { w: "High" | "Medium" | "Low" }) {
  const cls =
    w === "High"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : w === "Medium"
        ? "bg-warning/30 text-warning-foreground border-warning/40"
        : "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={`border ${cls} font-medium`}>
      {w} weightage
    </Badge>
  );
}

function ToggleChip({
  active,
  onClick,
  icon,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tone: "success" | "primary";
  children: React.ReactNode;
}) {
  const base = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border transition-colors";
  const activeCls =
    tone === "success"
      ? "bg-success/30 text-success-foreground border-success/40"
      : "bg-primary text-primary-foreground border-primary";
  const inactiveCls = "bg-card text-foreground border-border hover:bg-accent";
  return (
    <button type="button" onClick={onClick} className={`${base} ${active ? activeCls : inactiveCls}`}>
      {icon}
      {children}
    </button>
  );
}

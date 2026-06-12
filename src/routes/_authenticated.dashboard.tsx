import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { pb } from "@/lib/pb";
import { Progress } from "@/components/ui/progress";
import { BookOpen, NotebookPen, AlertTriangle, Timer, ArrowRight, LogIn } from "lucide-react";
import { useLoginModal } from "@/lib/login-modal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Stats = {
  chapters: number;
  cleared: number;
  papersDone: number;
  notes: number;
  mistakes: number;
};

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { openLogin } = useLoginModal();
  const [stats, setStats] = useState<Stats>({
    chapters: 0,
    cleared: 0,
    papersDone: 0,
    notes: 0,
    mistakes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStats({
        chapters: 0,
        cleared: 0,
        papersDone: 0,
        notes: 0,
        mistakes: 0,
      });
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const filter = `user_id = "${user.id}"`;
        const [progress, notes, mistakes] = await Promise.all([
          pb.collection("progress").getFullList({ filter }).catch(() => []),
          pb.collection("notes").getList(1, 1, { filter }).catch(() => ({ totalItems: 0 })),
          pb.collection("mistakes").getList(1, 1, { filter }).catch(() => ({ totalItems: 0 })),
        ]);
        const chapters = progress.length;
        const cleared = progress.filter((p: any) => p.concept_cleared).length;
        const papersDone = progress.filter((p: any) => p.past_papers_done).length;
        setStats({
          chapters,
          cleared,
          papersDone,
          notes: (notes as any).totalItems ?? 0,
          mistakes: (mistakes as any).totalItems ?? 0,
        });
      } catch (error: any) {
        console.error(error);
        if (error?.status === 403) {
          toast.error("PocketBase 403 Forbidden: Please unlock API Rules for your collections and click 'Save changes' in PocketBase Admin.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, authLoading]);

  const pct = stats.chapters ? Math.round((stats.cleared / stats.chapters) * 100) : 0;
  const name = user?.name || user?.email?.split("@")[0] || "Guest";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">{name}.</h1>
        <p className="text-muted-foreground mt-1">
          Here's where your CA preparation stands today.
        </p>
      </header>

      {!user && (
        <div className="card-soft p-5 flex items-center gap-4 flex-wrap bg-gradient-to-r from-accent/40 to-card">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <LogIn className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium">You're browsing as a guest.</div>
            <div className="text-sm text-muted-foreground">
              Sign in to save your syllabus progress, notes and mistakes.
            </div>
          </div>
          <Button
            onClick={openLogin}
            className="h-9 px-4 cursor-pointer"
          >
            Login / Sign up
          </Button>
        </div>
      )}

      {/* Hero progress card */}
      <div className="card-lift p-6 sm:p-8 bg-gradient-to-br from-card to-accent/40">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Syllabus completion</div>
            <div className="mt-2 text-5xl font-bold tracking-tight">{pct}%</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {stats.cleared} of {stats.chapters} chapters cleared
            </div>
          </div>
          <Link
            to="/syllabus"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open syllabus <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <Progress value={pct} className="h-2 mt-6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Past papers solved"
          value={stats.papersDone}
          tint="primary"
        />
        <StatCard
          icon={<NotebookPen className="h-4 w-4" />}
          label="Notes captured"
          value={stats.notes}
          tint="success"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Mistakes logged"
          value={stats.mistakes}
          tint="warning"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-soft p-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Timer className="h-4 w-4 text-primary" /> Daily target
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight">
            2 deep work sessions <span className="text-muted-foreground font-normal">/ today</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Each session is a 120-min Pomodoro in the Focus Zone.
          </p>
          <Link
            to="/focus"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
          >
            Start focus session <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="card-soft p-6">
          <div className="text-sm font-medium">Suggested next step</div>
          <p className="mt-3 text-base leading-relaxed">
            {stats.chapters === 0
              ? "Seed your syllabus to start tracking chapter progress."
              : pct < 30
                ? "Focus on High-weightage chapters first — they pay the most marks."
                : pct < 70
                  ? "Time to solve past papers. Mark them done in the Syllabus tracker."
                  : "Revise. Use Mistake Log to find your weak spots."}
          </p>
          <Link
            to="/syllabus"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
          >
            Go to Syllabus <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground">Syncing with PocketBase…</p>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: "primary" | "success" | "warning";
}) {
  const tintCls =
    tint === "primary"
      ? "bg-primary/10 text-primary"
      : tint === "success"
        ? "bg-success/30 text-success-foreground"
        : "bg-warning/30 text-warning-foreground";
  return (
    <div className="card-soft p-5">
      <div className={`h-8 w-8 rounded-lg grid place-items-center ${tintCls}`}>{icon}</div>
      <div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

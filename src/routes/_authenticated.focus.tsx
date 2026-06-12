import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/focus")({
  component: FocusZone,
});

const TOTAL = 120 * 60; // 120 minutes in seconds

function FocusZone() {
  const [remaining, setRemaining] = useState(TOTAL);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const startRemainingRef = useRef<number>(TOTAL);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const elapsed = (performance.now() - (startedAtRef.current ?? 0)) / 1000;
      const next = Math.max(0, startRemainingRef.current - elapsed);
      setRemaining(next);
      if (next <= 0) {
        setRunning(false);
        finished();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  const finished = () => {
    toast.success("Focus session complete. Take a break!");
    try {
      // Beep using WebAudio
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.frequency.value = 660;
      osc.connect(gain);
      gain.connect(ac.destination);
      gain.gain.setValueAtTime(0.0001, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ac.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.2);
      osc.start();
      osc.stop(ac.currentTime + 1.3);
    } catch {
      // ignore
    }
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("CA Hub — Focus session complete", {
        body: "120 minutes of deep work done.",
      });
    }
  };

  const start = () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    startedAtRef.current = performance.now();
    startRemainingRef.current = remaining > 0 ? remaining : TOTAL;
    if (remaining <= 0) setRemaining(TOTAL);
    setRunning(true);
  };

  const pause = () => {
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(TOTAL);
  };

  const pct = ((TOTAL - remaining) / TOTAL) * 100;
  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(remaining % 60)
    .toString()
    .padStart(2, "0");

  // SVG ring
  const R = 120;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Focus Zone</h1>
        <p className="text-muted-foreground mt-1">
          A 120-minute deep work session. No interruptions, no notifications, just one focused
          block.
        </p>
      </header>

      <div className="card-lift p-10 flex flex-col items-center bg-gradient-to-br from-card to-accent/30">
        <div className="relative h-[320px] w-[320px] grid place-items-center">
          <svg width="320" height="320" className="absolute inset-0 -rotate-90">
            <circle
              cx="160"
              cy="160"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted"
            />
            <circle
              cx="160"
              cy="160"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={C}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-primary transition-[stroke-dashoffset] duration-300 ease-linear"
            />
          </svg>
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground flex items-center justify-center gap-1.5">
              <Timer className="h-3 w-3" /> Deep work
            </div>
            <div className="mt-3 text-6xl font-bold tracking-tight tabular-nums">
              {mm}:{ss}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {Math.round(pct)}% complete
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3">
          {!running ? (
            <Button size="lg" className="h-12 px-8" onClick={start}>
              <Play className="h-4 w-4" /> {remaining < TOTAL ? "Resume" : "Start session"}
            </Button>
          ) : (
            <Button size="lg" variant="outline" className="h-12 px-8" onClick={pause}>
              <Pause className="h-4 w-4" /> Pause
            </Button>
          )}
          <Button size="lg" variant="ghost" className="h-12 px-6" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <Tip title="Single tab" body="Close everything you don't need for this session." />
        <Tip title="One topic" body="Pick a single chapter or past-paper section." />
        <Tip
          title="Capture, don't chase"
          body="Stray thoughts? Jot them in the Knowledge Base, keep moving."
        />
      </div>
    </div>
  );
}

function Tip({ title, body }: { title: string; body: string }) {
  return (
    <div className="card-soft p-4">
      <div className="font-medium">{title}</div>
      <div className="text-muted-foreground mt-1 text-[13px] leading-relaxed">{body}</div>
    </div>
  );
}

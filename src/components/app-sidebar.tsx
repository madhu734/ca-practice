import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  NotebookPen,
  AlertTriangle,
  Timer,
  Settings,
  GraduationCap,
  LogOut,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { pb, pbFileUrl, USERS_COLLECTION } from "@/lib/pb";
import { useLoginModal } from "@/lib/login-modal";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Syllabus", url: "/syllabus", icon: BookOpen },
  { title: "Knowledge Base", url: "/knowledge", icon: NotebookPen },
  { title: "Mistake Log", url: "/mistakes", icon: AlertTriangle },
  { title: "Focus Zone", url: "/focus", icon: Timer },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout } = useAuth();
  const { openLogin } = useLoginModal();
  const rec = pb.authStore.record;
  const avatarUrl =
    user && rec?.avatar
      ? pbFileUrl({ id: rec.id, collectionName: USERS_COLLECTION }, rec.avatar)
      : "";

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
          <GraduationCap className="h-4.5 w-4.5" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold tracking-tight">CA Hub</div>
          <div className="text-[11px] text-muted-foreground">Smart Study Dashboard</div>
        </div>
      </div>

      <nav className="px-3 mt-2 flex-1 space-y-0.5">
        {items.map((it) => {
          const active = pathname === it.url || pathname.startsWith(it.url + "/");
          return (
            <Link
              key={it.url}
              to={it.url}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              ].join(" ")}
            >
              <it.icon className="h-4 w-4" />
              {it.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
        >
          <Settings className="h-4 w-4" /> Settings
        </Link>

        {user ? (
          <div className="mt-3 flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-accent grid place-items-center text-xs font-semibold text-accent-foreground overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name ?? "Student"}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={openLogin} className="w-full gap-2 mt-3">
            <LogIn className="h-4 w-4" /> Login / Sign up
          </Button>
        )}
      </div>
    </aside>
  );
}

import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { AITutorDrawer } from "@/components/ai-tutor-drawer";
import { LoginModalProvider, useLoginModal } from "@/lib/login-modal";
import { useAuth } from "@/lib/auth";
import { pb, pbFileUrl, USERS_COLLECTION } from "@/lib/pb";
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

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Syllabus", url: "/syllabus", icon: BookOpen },
  { title: "Knowledge", url: "/knowledge", icon: NotebookPen },
  { title: "Mistakes", url: "/mistakes", icon: AlertTriangle },
  { title: "Focus", url: "/focus", icon: Timer },
];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <LoginModalProvider>
      <AppLayout />
    </LoginModalProvider>
  );
}

function AppLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout } = useAuth();
  const { openLogin } = useLoginModal();
  const rec = pb.authStore.record;
  const avatarUrl =
    user && rec?.avatar
      ? pbFileUrl({ id: rec.id, collectionName: USERS_COLLECTION }, rec.avatar)
      : "";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex md:hidden h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">CA Hub</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className={[
              "p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
              pathname === "/settings" ? "text-primary bg-accent" : "",
            ].join(" ")}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-accent grid place-items-center text-xs font-semibold text-accent-foreground overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
                )}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLogin}
              className="flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden h-16 border-t border-border bg-background/95 backdrop-blur justify-around items-center px-2">
        {navItems.map((it) => {
          const active = pathname === it.url || pathname.startsWith(it.url + "/");
          return (
            <Link
              key={it.url}
              to={it.url}
              className={[
                "flex flex-col items-center justify-center flex-1 py-1 rounded-md text-xs transition-colors",
                active
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <it.icon className={["h-5 w-5 mb-1 transition-transform active:scale-95", active ? "text-primary" : "text-muted-foreground"].join(" ")} />
              <span className="text-[10px] tracking-tight">{it.title}</span>
            </Link>
          );
        })}
      </nav>

      <AITutorDrawer />
    </div>
  );
}

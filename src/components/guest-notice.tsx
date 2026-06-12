import { LogIn } from "lucide-react";
import { useLoginModal } from "@/lib/login-modal";
import { Button } from "@/components/ui/button";

export function GuestNotice({ message }: { message?: string }) {
  const { openLogin } = useLoginModal();

  return (
    <div className="card-soft p-5 flex items-center gap-4 flex-wrap bg-gradient-to-r from-accent/40 to-card">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
        <LogIn className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">Sign in to unlock this module</div>
        <div className="text-sm text-muted-foreground">
          {message ?? "Your data is saved per-user in your CA Hub account."}
        </div>
      </div>
      <Button
        onClick={openLogin}
        className="h-9 px-4 cursor-pointer"
      >
        Login / Sign up
      </Button>
    </div>
  );
}

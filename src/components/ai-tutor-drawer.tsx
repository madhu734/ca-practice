import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { chatComplete, getAISettings, type ChatMsg } from "@/lib/ai";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

const SYSTEM: ChatMsg = {
  role: "system",
  content:
    "You are a calm, expert tutor for Indian Chartered Accountancy (CA) students. Be concise, use bullet points, and cite ICAI module names when helpful. Never invent legal sections — if unsure, say so.",
};

export function AITutorDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    if (!getAISettings()) {
      toast.error("Add your Azure OpenAI credentials in Settings first.");
      return;
    }
    const next = [...messages, { role: "user", content: text } as ChatMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await chatComplete([SYSTEM, ...next]);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 h-14 rounded-full shadow-lg pl-5 pr-6 gap-2 z-40"
          size="lg"
        >
          <Sparkles className="h-4.5 w-4.5" /> AI Tutor
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Tutor
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-muted/30">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground pt-10">
              <Bot className="h-8 w-8 mx-auto mb-3 text-primary/70" />
              <p>Ask anything about your CA syllabus.</p>
              <p className="mt-1 text-xs">
                Need to connect?{" "}
                <Link to="/settings" className="text-primary underline">
                  Open Settings
                </Link>
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-2"}>
              {m.role === "assistant" && (
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={[
                  "rounded-2xl px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm",
                ].join(" ")}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-accent grid place-items-center shrink-0 ml-2">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="flex gap-2 items-center text-sm text-muted-foreground">
              <div className="h-7 w-7 rounded-full bg-primary/80 grid place-items-center">
                <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t p-3 bg-background">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about DT, GST, FM concepts…"
              className="min-h-[44px] max-h-32 resize-none"
            />
            <Button onClick={send} disabled={busy || !input.trim()} size="icon" className="h-11 w-11">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

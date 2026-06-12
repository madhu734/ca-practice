// Azure OpenAI client (browser-side, keys stored in localStorage as requested).
export type AISettings = {
  endpoint: string; // e.g. https://my-resource.openai.azure.com
  deployment: string;
  apiKey: string;
  apiVersion?: string;
};

const KEY = "ca_hub_ai_settings_v1";

export function getAISettings(): AISettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AISettings) : null;
  } catch {
    return null;
  }
}

export function saveAISettings(s: AISettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearAISettings() {
  localStorage.removeItem(KEY);
}

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export async function chatComplete(messages: ChatMsg[]): Promise<string> {
  const s = getAISettings();
  if (!s?.endpoint || !s.deployment || !s.apiKey) {
    throw new Error("AI not configured. Open Settings to add your Azure OpenAI credentials.");
  }
  const base = s.endpoint.replace(/\/+$/, "");
  const apiVersion = s.apiVersion || "2024-08-01-preview";
  const url = `${base}/openai/deployments/${encodeURIComponent(s.deployment)}/chat/completions?api-version=${apiVersion}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": s.apiKey,
    },
    body: JSON.stringify({ messages, temperature: 0.5 }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Azure OpenAI error ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

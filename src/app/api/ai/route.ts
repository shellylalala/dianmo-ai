import { auth } from "@/auth";
import { buildMessages, type AiAction } from "@/lib/ai-prompts";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { action, text, title } = (await req.json()) as {
    action: AiAction;
    text: string;
    title?: string;
  };
  if (!text?.trim() || text.length > 8000) {
    return new Response("Bad Request", { status: 400 });
  }

  // 直接调 DeepSeek OpenAI 兼容接口，SSE stream
  const upstream = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: buildMessages(action, text, title),
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    console.error("[DeepSeek upstream error]", upstream.status, err);
    return new Response("Upstream Error", { status: 502 });
  }

  // 把 SSE 行解析为纯文本，流式转发给客户端
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? ""; // 末尾可能是不完整行
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // 跳过非 JSON 行
          }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

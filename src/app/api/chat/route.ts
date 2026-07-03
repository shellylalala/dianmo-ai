import { auth } from "@/auth";

type Message = { role: "system" | "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { messages } = (await req.json()) as { messages: Message[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Bad Request", { status: 400 });
  }

  const upstream = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "你是点墨 AI 智能助手，帮助用户写作、查找信息、解决问题。所有回复必须使用标准 Markdown（GFM）输出，使用中文。可使用标题、列表、表格、代码块与引用；除非用户明确要求，不要输出 HTML 标签。",
        },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    console.error("[Chat upstream error]", upstream.status, err);
    return new Response("Upstream Error", { status: 502 });
  }

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
        buf = lines.pop() ?? "";
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

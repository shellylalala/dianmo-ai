"use client";

import { useMemo, useRef, useState } from "react";
import { SendHorizonal, Copy, CornerDownLeft, Sparkles } from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorContext } from "@/components/dashboard/editor-provider";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function markdownToSafeHtml(markdown: string) {
  const rawHtml = marked.parse(markdown, {
    gfm: true,
    breaks: true,
  }) as string;
  return DOMPurify.sanitize(rawHtml);
}

function AssistantMarkdown({ content }: { content: string }) {
  const html = useMemo(() => markdownToSafeHtml(content), [content]);
  return (
    <div
      className="prose prose-sm prose-neutral dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { editorRef, persistNowRef } = useEditorContext();

  async function send() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { id: uid(), role: "user", content: text };
    const assistantId = uid();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    try {
      // 把历史消息（不含当前空的 assistant 占位）传给接口
      const history = [...messages, userMsg].map(({ role, content }) => ({
        role,
        content,
      }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "请求失败，请稍后重试。" }
              : m,
          ),
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        // 流式更新最后一条 assistant 消息
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m,
          ),
        );
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } finally {
      setIsStreaming(false);
    }
  }

  async function insertIntoEditor(content: string) {
    const editor = editorRef.current;
    if (!editor) {
      toast.error("请先打开一个文档");
      return;
    }

    const html = markdownToSafeHtml(content);
    editor.chain().focus().insertContent(html).run();
    await persistNowRef.current?.();
    toast.success("已插入到编辑器");
  }

  function copyToClipboard(content: string) {
    navigator.clipboard.writeText(content);
    toast.success("已复制");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 标题 */}
      <div className="border-border flex shrink-0 items-center gap-2 border-b px-4 py-3">
        <Sparkles className="text-primary h-4 w-4" />
        <span className="text-sm font-semibold">AI 助手</span>
      </div>

      {/* 消息列表 */}
      <ScrollArea className="min-h-0 flex-1 px-3 py-3">
        {messages.length === 0 ? (
          <p className="text-muted-foreground mt-8 text-center text-xs">
            向 AI 提问，获取灵感或解决写作难题
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content ? (
                    msg.role === "assistant" ? (
                      <AssistantMarkdown content={msg.content} />
                    ) : (
                      msg.content
                    )
                  ) : (
                    <span className="text-muted-foreground animate-pulse">
                      思考中…
                    </span>
                  )}
                </div>
                {/* 操作按钮：仅 AI 消息且内容非空时显示 */}
                {msg.role === "assistant" && msg.content && (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title="插入到编辑器"
                      onClick={() => insertIntoEditor(msg.content)}
                    >
                      <CornerDownLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title="复制"
                      onClick={() => copyToClipboard(msg.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* 输入区 */}
      <div className="border-border shrink-0 border-t p-3">
        <div className="flex flex-col gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="输入问题…（Enter 发送，Shift+Enter 换行）"
            rows={3}
            disabled={isStreaming}
            className="resize-none text-sm"
          />
          <Button
            size="sm"
            onClick={send}
            disabled={isStreaming || !input.trim()}
            className="gap-1.5 self-end"
          >
            <SendHorizonal className="h-3.5 w-3.5" />
            {isStreaming ? "生成中…" : "发送"}
          </Button>
        </div>
      </div>
    </div>
  );
}

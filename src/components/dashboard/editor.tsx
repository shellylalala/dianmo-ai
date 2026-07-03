"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { Sparkles, ChevronDown } from "lucide-react";
import { renameDocument, updateDocumentContent } from "@/lib/actions";
import { useEditorContext } from "@/components/dashboard/editor-provider";
import type { AiAction } from "@/lib/ai-prompts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type SaveState = "saved" | "saving";

// 5A 划词动作
const BUBBLE_ACTIONS: { action: AiAction; label: string }[] = [
  { action: "expand", label: "扩写" },
  { action: "simplify", label: "简化" },
  { action: "translate", label: "翻译" },
  { action: "tone", label: "改语气" },
  { action: "explain", label: "解释" },
];

// 5B 写作动作
const WRITE_ACTIONS: { action: AiAction; label: string; desc: string }[] = [
  { action: "continue", label: "续写", desc: "基于现有内容继续写下去" },
  { action: "outline", label: "生成大纲", desc: "为文档生成结构化大纲" },
  { action: "summary", label: "生成摘要", desc: "总结文档核心内容" },
  { action: "brainstorm", label: "头脑风暴", desc: "围绕主题发散思维" },
];

// 共用：调流式 AI 接口，把响应流写入 onChunk 回调
async function streamAi(
  action: AiAction,
  text: string,
  title: string,
  onChunk: (chunk: string) => void,
): Promise<boolean> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, text, title }),
  });
  if (!res.ok || !res.body) return false;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) onChunk(chunk);
  }
  return true;
}

export function Editor({
  docId,
  initialTitle,
  initialContent,
}: {
  docId: string;
  initialTitle: string;
  initialContent: JSONContent | null;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [save, setSave] = useState<SaveState>("saved");
  const [isAiRunning, setIsAiRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { editorRef } = useEditorContext();

  const scheduleSave = useCallback(
    (json: JSONContent) => {
      setSave("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await updateDocumentContent(docId, json);
        setSave("saved");
      }, 800);
    },
    [docId],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "开始输入，或按 / 使用命令…" }),
    ],
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => scheduleSave(editor.getJSON()),
  });

  // 把当前 editor 实例注册到 Context，让 AiChat 的"插入"按钮能访问
  useEffect(() => {
    if (editor) editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  async function saveTitle() {
    if (title.trim() && title !== initialTitle) {
      await renameDocument(docId, title.trim());
    }
  }

  // 5A：划词替换
  async function runAi(action: AiAction) {
    if (!editor || isAiRunning) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    if (!text.trim()) return;

    setIsAiRunning(true);
    try {
      editor.chain().focus().deleteRange({ from, to }).run();
      let insertPos = from;
      await streamAi(action, text, title, (chunk) => {
        editor.view.dispatch(editor.state.tr.insertText(chunk, insertPos));
        insertPos += chunk.length;
      });
    } finally {
      setIsAiRunning(false);
    }
  }

  // 5B：写作命令，以全文为上下文，结果追加到文档末尾
  async function runWriteAi(action: AiAction) {
    if (!editor || isAiRunning) return;
    const fullText = editor.getText();
    setIsAiRunning(true);
    try {
      // 先在末尾插入换行，确保 AI 结果另起一段
      const endPos = editor.state.doc.content.size - 1;
      editor.chain().focus().insertContentAt(endPos, "<p></p>").run();

      let insertPos = editor.state.doc.content.size - 1;
      await streamAi(action, fullText || title, title, (chunk) => {
        editor.view.dispatch(editor.state.tr.insertText(chunk, insertPos));
        insertPos += chunk.length;
      });
    } finally {
      setIsAiRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      {/* 5A 划词浮动菜单 */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="bg-popover border-border flex items-center gap-1 rounded-lg border px-1 py-1 shadow-md"
        >
          {BUBBLE_ACTIONS.map(({ action, label }) => (
            <button
              key={action}
              onClick={() => runAi(action)}
              disabled={isAiRunning}
              className="hover:bg-accent rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isAiRunning ? "…" : label}
            </button>
          ))}
        </BubbleMenu>
      )}

      {/* 顶部工具栏：保存状态 + 5B AI 写作 */}
      <div className="mb-4 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isAiRunning}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isAiRunning ? "AI 生成中…" : "AI 写作"}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {WRITE_ACTIONS.map(({ action, label, desc }) => (
              <DropdownMenuItem
                key={action}
                onClick={() => runWriteAi(action)}
                className="flex flex-col items-start gap-0.5"
              >
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground text-xs">{desc}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-muted-foreground text-xs">
          {save === "saving" ? "保存中…" : "已保存"}
        </span>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        placeholder="无标题"
        className="mb-4 w-full border-none bg-transparent text-3xl font-bold outline-none"
      />
      <EditorContent editor={editor} />
    </div>
  );
}

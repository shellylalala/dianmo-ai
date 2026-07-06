"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import type { JSONContent } from "@tiptap/react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import {
  Bold,
  Italic,
  Code,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { renameDocument, updateDocumentContent } from "@/lib/actions";
import { useEditorContext } from "@/components/dashboard/editor-provider";
import { EditorToolbar } from "@/components/dashboard/editor-toolbar";
import { BlockHandle } from "@/components/dashboard/block-handle";
import type { AiAction } from "@/lib/ai-prompts";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useSession } from "next-auth/react";

type SaveState = "saved" | "saving";

function normalizeJsonContent(json: JSONContent): JSONContent {
  // Server Action 参数必须是可序列化的纯对象；先做一次 JSON 归一化。
  return JSON.parse(JSON.stringify(json)) as JSONContent;
}

function markdownToSafeHtml(markdown: string) {
  const rawHtml = marked.parse(markdown, {
    gfm: true,
    breaks: true,
  }) as string;
  return DOMPurify.sanitize(rawHtml);
}

// ── 5A 划词 AI 动作 ──
const BUBBLE_ACTIONS: { action: AiAction; label: string }[] = [
  { action: "expand", label: "扩写" },
  { action: "simplify", label: "简化" },
  { action: "translate", label: "翻译" },
  { action: "tone", label: "改语气" },
  { action: "explain", label: "解释" },
];

// ── 共用流式 AI 请求 ──
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
  const { data: session } = useSession();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { editorRef, persistNowRef } = useEditorContext();

  // ── 防抖自动保存 ──
  const scheduleSave = useCallback(
    (json: JSONContent) => {
      setSave("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          const normalized = normalizeJsonContent(json);
          await updateDocumentContent(docId, normalized);
          setSave("saved");
        } catch (error) {
          console.error("[Editor] autosave failed", error);
          setSave("saved");
        }
      }, 800);
    },
    [docId],
  );

  const ydoc = useMemo(() => new Y.Doc(), []);
  const provider = useMemo(
    () =>
      new HocuspocusProvider({
        url: process.env.NEXT_PUBLIC_COLLAB_WS_URL ?? "ws://127.0.0.1:1234",
        name: docId,
        document: ydoc,
        // 步骤 4 先不鉴权，步骤 6 再加 token
      }),
    [docId, ydoc],
  );

  // 清理
  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  // 稳定随机色（模块级常量，不在渲染期调用 Math.random）
  const [userColor] = useState(
    () =>
      "#" +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0"),
  );

  useEffect(() => {
    provider.setAwarenessField("user", {
      name: session?.user?.name ?? session?.user?.email ?? "匿名",
      color: userColor,
    });
  }, [provider, session, userColor]);

  // ── Tiptap 编辑器 ──
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        undoRedo: false, // ← 关掉 Tiptap 自带 undo/redo
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Placeholder.configure({ placeholder: "开始输入..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCaret.configure({
        provider: provider,
        user: {
          name: session?.user?.name ?? session?.user?.email ?? "匿名",
          color: userColor,
        },
        render: (user) => {
          const cursor = document.createElement("span");
          cursor.classList.add("collaboration-carets__caret");
          cursor.style.borderLeft = `2px solid ${user.color as string}`;

          const label = document.createElement("span");
          label.classList.add("collaboration-carets__label");
          label.style.backgroundColor = user.color as string;
          label.textContent = (user.name as string) ?? "匿名";
          cursor.appendChild(label);

          return cursor;
        },
      }),
    ],
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none",
        spellcheck: "true",
      },
    },
    onTransaction: ({ editor, transaction }) => {
      if (transaction.docChanged) {
        scheduleSave(editor.getJSON());
      }
    },
  });

  // ── 注册到 Context（供 AiChat 插入用） ──
  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
      persistNowRef.current = async () => {
        setSave("saving");
        try {
          const normalized = normalizeJsonContent(editor.getJSON());
          await updateDocumentContent(docId, normalized);
          setSave("saved");
        } catch (error) {
          console.error("[Editor] manual persist failed", error);
          setSave("saved");
        }
      };
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
      editorRef.current = null;
      persistNowRef.current = null;
    };
  }, [docId, editor, editorRef, persistNowRef]);

  // ── 标题（失焦保存） ──
  async function saveTitle() {
    if (title.trim() && title !== initialTitle) {
      await renameDocument(docId, title.trim());
    }
  }

  // ── 5A 划词：选区替换 ──
  async function runAi(action: AiAction) {
    if (!editor || isAiRunning) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    if (!text.trim()) return;
    setIsAiRunning(true);
    try {
      editor.chain().focus().deleteRange({ from, to }).run();
      let markdownResult = "";
      await streamAi(action, text, title, (chunk) => {
        markdownResult += chunk;
      });
      const html = markdownToSafeHtml(markdownResult.trim());
      editor.chain().focus().insertContentAt(from, html).run();
    } finally {
      setIsAiRunning(false);
    }
  }

  // ── 块句柄 AI：直接用传入的 from/to/text（不读选区）──
  async function runAiOnBlock(
    action: AiAction,
    from: number,
    to: number,
    text: string,
  ) {
    if (!editor || isAiRunning || !text.trim()) return;
    setIsAiRunning(true);
    try {
      const docMax = Math.max(1, editor.state.doc.content.size - 1);
      const safeFrom = Math.max(1, Math.min(from, docMax));
      const safeTo = Math.max(safeFrom, Math.min(to, docMax));

      if (safeTo > safeFrom) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from: safeFrom, to: safeTo })
          .deleteSelection()
          .run();
      } else {
        editor.chain().focus().setTextSelection(safeFrom).run();
      }

      let markdownResult = "";
      await streamAi(action, text, title, (chunk) => {
        markdownResult += chunk;
      });
      const html = markdownToSafeHtml(markdownResult.trim());
      editor.chain().focus().insertContentAt(safeFrom, html).run();
    } finally {
      setIsAiRunning(false);
    }
  }

  // ── 5B AI 写作：追加到文末 ──
  async function runWriteAi(action: AiAction) {
    if (!editor || isAiRunning) return;
    const fullText = editor.getText();
    setIsAiRunning(true);
    try {
      const endPos = editor.state.doc.content.size - 1;
      editor.chain().focus().insertContentAt(endPos, "<p></p>").run();
      let markdownResult = "";
      await streamAi(action, fullText || title, title, (chunk) => {
        markdownResult += chunk;
      });
      const html = markdownToSafeHtml(markdownResult.trim());
      editor.chain().focus().insertContentAt(endPos, html).run();
    } finally {
      setIsAiRunning(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* ── 粘性顶部工具栏 ── */}
      {editor && (
        <EditorToolbar
          editor={editor}
          isAiRunning={isAiRunning}
          saveState={save}
          onWriteAi={runWriteAi}
        />
      )}

      {/* ── BubbleMenu 选中浮出 ── */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="bg-popover border-border flex items-center gap-0.5 rounded-lg border px-1 py-1 shadow-md"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`hover:bg-accent rounded px-2 py-1 text-xs transition-colors ${editor.isActive("bold") ? "bg-accent" : ""}`}
            title="加粗"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`hover:bg-accent rounded px-2 py-1 text-xs transition-colors ${editor.isActive("italic") ? "bg-accent" : ""}`}
            title="斜体"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`hover:bg-accent rounded px-2 py-1 text-xs transition-colors ${editor.isActive("strike") ? "bg-accent" : ""}`}
            title="删除线"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`hover:bg-accent rounded px-2 py-1 text-xs transition-colors ${editor.isActive("code") ? "bg-accent" : ""}`}
            title="行内代码"
          >
            <Code className="h-3.5 w-3.5" />
          </button>

          <div className="bg-border mx-1 h-4 w-px" />

          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`hover:bg-accent rounded px-2 py-1 text-xs transition-colors ${editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}`}
            title="H1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`hover:bg-accent rounded px-2 py-1 text-xs transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}`}
            title="H2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`hover:bg-accent rounded px-2 py-1 text-xs transition-colors ${editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}`}
            title="H3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`hover:bg-accent rounded px-2 py-1 text-xs transition-colors ${editor.isActive("bulletList") ? "bg-accent" : ""}`}
            title="无序列表"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`hover:bg-accent rounded px-2 py-1 text-xs transition-colors ${editor.isActive("orderedList") ? "bg-accent" : ""}`}
            title="有序列表"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`hover:bg-accent rounded px-2 py-1 text-xs transition-colors ${editor.isActive("blockquote") ? "bg-accent" : ""}`}
            title="引用"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>

          <div className="bg-border mx-1 h-4 w-px" />

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

      {/* ── 正文区域 ── */}
      <div className="mx-auto w-full max-w-4xl flex-1 px-8 py-8 pl-14">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          placeholder="无标题"
          className="placeholder:text-muted-foreground/40 mb-8 w-full border-none bg-transparent text-4xl font-extrabold tracking-tight outline-none"
        />
        <div className="relative">
          <EditorContent editor={editor} />
          {editor && (
            <BlockHandle
              editor={editor}
              isAiRunning={isAiRunning}
              onRunAi={runAiOnBlock}
            />
          )}
        </div>
      </div>
    </div>
  );
}

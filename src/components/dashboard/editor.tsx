"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { renameDocument, updateDocumentContent } from "@/lib/actions";

type SaveState = "saved" | "saving";

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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 防抖保存正文
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
    immediatelyRender: false, // Next SSR 必须关，否则 hydration mismatch
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

  // 标题保存（失焦时）
  async function saveTitle() {
    if (title.trim() && title !== initialTitle) {
      await renameDocument(docId, title.trim());
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="text-muted-foreground mb-2 text-right text-xs">
        {save === "saving" ? "保存中…" : "已保存"}
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

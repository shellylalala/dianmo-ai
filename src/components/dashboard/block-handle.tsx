"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  GripVertical,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Copy,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AiAction } from "@/lib/ai-prompts";

const BLOCK_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "PRE",
  "LI",
]);

interface Props {
  editor: Editor;
  isAiRunning: boolean;
  onRunAi: (action: AiAction, from: number, to: number, text: string) => void;
}

export function BlockHandle({ editor, isAiRunning, onRunAi }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const closeCleanupTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const currentHighlightEl = useRef<HTMLElement | null>(null);
  const currentBlockPosRef = useRef<number | null>(null);
  const menuTargetPosRef = useRef<number | null>(null);
  const menuOpenRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);

  const [handle, setHandle] = useState<{
    visible: boolean;
    top: number;
    el: HTMLElement | null;
  }>({ visible: false, top: 0, el: null });

  function clampPos(pos: number) {
    const max = Math.max(1, editor.state.doc.content.size - 1);
    return Math.max(1, Math.min(pos, max));
  }

  function findBlock(
    target: HTMLElement,
    editorEl: HTMLElement,
  ): HTMLElement | null {
    let el: HTMLElement | null = target;
    while (el && el !== editorEl) {
      if (BLOCK_TAGS.has(el.tagName)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function getBlockRangeFromPos(rawPos: number) {
    const pos = clampPos(rawPos);
    const $pos = editor.state.doc.resolve(pos);

    let depth = $pos.depth;
    while (depth > 0 && !$pos.node(depth).isBlock) {
      depth -= 1;
    }

    if (depth <= 0) {
      const sFrom = clampPos(editor.state.selection.from);
      const sTo = clampPos(editor.state.selection.to);
      const from = Math.min(sFrom, sTo);
      const to = Math.max(sFrom, sTo);
      return {
        from,
        to,
        text: editor.state.doc.textBetween(from, to, "\n"),
      };
    }

    const from = clampPos($pos.start(depth));
    const to = Math.max(from, clampPos($pos.end(depth)));
    return {
      from,
      to,
      text: editor.state.doc.textBetween(from, to, "\n"),
    };
  }

  function getTargetRange() {
    const pos = menuTargetPosRef.current ?? currentBlockPosRef.current;
    if (typeof pos === "number") {
      return getBlockRangeFromPos(pos);
    }

    const sFrom = clampPos(editor.state.selection.from);
    const sTo = clampPos(editor.state.selection.to);
    const from = Math.min(sFrom, sTo);
    const to = Math.max(sFrom, sTo);
    return {
      from,
      to,
      text: editor.state.doc.textBetween(from, to, "\n"),
    };
  }

  function applyHighlight(el: HTMLElement | null) {
    if (currentHighlightEl.current && currentHighlightEl.current !== el) {
      currentHighlightEl.current.classList.remove("block-hovered");
    }
    if (el) el.classList.add("block-hovered");
    currentHighlightEl.current = el;
  }

  useEffect(() => {
    const editorEl = editor.view.dom as HTMLElement;

    function onMouseMove(e: MouseEvent) {
      clearTimeout(hideTimer.current);
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = undefined;
        const target = e.target as HTMLElement;
        if (target.closest("[data-block-handle]")) return;
        if (!wrapperRef.current) return;

        const block = findBlock(target, editorEl);
        if (!block) return;

        const blockRect = block.getBoundingClientRect();
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const top = blockRect.top - wrapperRect.top + blockRect.height / 2 - 12;

        try {
          currentBlockPosRef.current = editor.view.posAtDOM(block, 0);
        } catch {
          currentBlockPosRef.current = null;
        }

        applyHighlight(block);
        setHandle((s) =>
          s.visible && s.el === block && Math.abs(s.top - top) < 1
            ? s
            : { visible: true, top, el: block },
        );
      });
    }

    function onMouseLeave() {
      if (menuOpenRef.current) return;
      hideTimer.current = setTimeout(() => {
        if (menuOpenRef.current) return;
        applyHighlight(null);
        setHandle((s) => ({ ...s, visible: false, el: null }));
      }, 220);
    }

    editorEl.addEventListener("mousemove", onMouseMove);
    editorEl.addEventListener("mouseleave", onMouseLeave);

    return () => {
      clearTimeout(hideTimer.current);
      clearTimeout(closeCleanupTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      applyHighlight(null);
      editorEl.removeEventListener("mousemove", onMouseMove);
      editorEl.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [editor]);

  function setType(type: string, attrs?: { level?: 1 | 2 | 3 | 4 }) {
    const { from } = getTargetRange();
    editor.chain().focus().setTextSelection(from).run();

    switch (type) {
      case "paragraph":
        editor.chain().focus().setParagraph().run();
        break;
      case "heading":
        editor.chain().focus().toggleHeading({ level: attrs!.level! }).run();
        break;
      case "bulletList":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "orderedList":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "taskList":
        editor.chain().focus().toggleTaskList().run();
        break;
      case "blockquote":
        editor.chain().focus().toggleBlockquote().run();
        break;
      case "codeBlock":
        editor.chain().focus().toggleCodeBlock().run();
        break;
    }
  }

  function handleAi(action: AiAction) {
    const { from, to, text } = getTargetRange();
    if (!text.trim()) return;
    onRunAi(action, from, to, text);
  }

  function duplicateBlock() {
    const { from } = getTargetRange();
    const node = editor.state.doc.nodeAt(from);
    if (!node) return;
    editor
      .chain()
      .focus()
      .insertContentAt(from + node.nodeSize, node.toJSON())
      .run();
  }

  function deleteBlock() {
    const { from } = getTargetRange();
    editor
      .chain()
      .focus()
      .setTextSelection(from)
      .selectParentNode()
      .deleteSelection()
      .run();
  }

  return (
    <div
      ref={wrapperRef}
      className="absolute top-0 left-0 h-0 w-0"
      onMouseEnter={() => clearTimeout(hideTimer.current)}
    >
      {handle.visible && (
        <DropdownMenu
          onOpenChange={(open) => {
            menuOpenRef.current = open;
            if (open) {
              menuTargetPosRef.current = currentBlockPosRef.current;
            }
            if (!open) {
              clearTimeout(closeCleanupTimer.current);
              closeCleanupTimer.current = setTimeout(() => {
                clearTimeout(hideTimer.current);
                currentHighlightEl.current?.classList.remove("block-hovered");
                currentHighlightEl.current = null;
                menuTargetPosRef.current = null;
                setHandle((s) => ({ ...s, visible: false, el: null }));
              }, 180);
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              data-block-handle
              onPointerDown={() => {
                menuTargetPosRef.current = currentBlockPosRef.current;
              }}
              onMouseEnter={() => clearTimeout(hideTimer.current)}
              style={{ top: handle.top }}
              className="text-muted-foreground/30 hover:bg-accent hover:text-foreground absolute -left-7 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-all focus:outline-none"
              tabIndex={-1}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="left"
            align="start"
            className="w-44"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              转换为
            </DropdownMenuLabel>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setType("paragraph");
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <Pilcrow className="mr-2 h-3.5 w-3.5" />
              正文
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setType("heading", { level: 1 });
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <Heading1 className="mr-2 h-3.5 w-3.5" />
              标题 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setType("heading", { level: 2 });
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <Heading2 className="mr-2 h-3.5 w-3.5" />
              标题 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setType("heading", { level: 3 });
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <Heading3 className="mr-2 h-3.5 w-3.5" />
              标题 3
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setType("heading", { level: 4 });
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <Heading4 className="mr-2 h-3.5 w-3.5" />
              标题 4
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setType("bulletList");
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <List className="mr-2 h-3.5 w-3.5" />
              无序列表
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setType("orderedList");
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <ListOrdered className="mr-2 h-3.5 w-3.5" />
              有序列表
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setType("taskList");
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <ListChecks className="mr-2 h-3.5 w-3.5" />
              任务列表
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setType("blockquote");
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <Quote className="mr-2 h-3.5 w-3.5" />
              引用
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setType("codeBlock");
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <Code2 className="mr-2 h-3.5 w-3.5" />
              代码块
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-muted-foreground text-xs">
              AI 操作
            </DropdownMenuLabel>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAi("expand");
              }}
              onSelect={(e) => e.preventDefault()}
              disabled={isAiRunning}
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              扩写
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAi("simplify");
              }}
              onSelect={(e) => e.preventDefault()}
              disabled={isAiRunning}
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              简化
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAi("translate");
              }}
              onSelect={(e) => e.preventDefault()}
              disabled={isAiRunning}
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              翻译
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAi("tone");
              }}
              onSelect={(e) => e.preventDefault()}
              disabled={isAiRunning}
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              改语气
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAi("explain");
              }}
              onSelect={(e) => e.preventDefault()}
              disabled={isAiRunning}
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              解释
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                duplicateBlock();
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <Copy className="mr-2 h-3.5 w-3.5" />
              复制块
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteBlock();
              }}
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              删除块
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

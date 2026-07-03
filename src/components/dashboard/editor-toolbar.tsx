"use client";

import type { Editor as TiptapEditor } from "@tiptap/react";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Minus,
  Sparkles,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Pilcrow,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { AiAction } from "@/lib/ai-prompts";

// ── 写作命令定义 ──
const WRITE_COMMANDS: { action: AiAction; label: string; desc: string }[] = [
  { action: "continue", label: "续写", desc: "基于现有内容继续写下去" },
  { action: "outline", label: "生成大纲", desc: "为文档生成结构化大纲" },
  { action: "summary", label: "生成摘要", desc: "总结文档核心内容" },
  { action: "brainstorm", label: "头脑风暴", desc: "围绕主题发散思维" },
];

// ── 标题级别 ──
const HEADINGS = [
  { level: 1, label: "标题 1", icon: Heading1 },
  { level: 2, label: "标题 2", icon: Heading2 },
  { level: 3, label: "标题 3", icon: Heading3 },
  { level: 4, label: "标题 4", icon: Heading4 },
  { level: 5, label: "标题 5", icon: Heading5 },
  { level: 6, label: "标题 6", icon: Heading6 },
] as const;

// ── Prop 类型 ──
interface EditorToolbarProps {
  editor: TiptapEditor;
  isAiRunning: boolean;
  saveState: string;
  onWriteAi: (action: AiAction) => void;
}

// ── 工具按钮 ──
function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`hover:bg-accent rounded-md p-1.5 text-sm transition-colors ${
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ── 工具栏组件 ──
export function EditorToolbar({
  editor,
  isAiRunning,
  saveState,
  onWriteAi,
}: EditorToolbarProps) {
  const hasSelection = !editor.state.selection.empty;

  return (
    <div className="border-border bg-background/95 sticky top-0 z-20 flex items-center gap-1 border-b px-4 py-1.5 backdrop-blur">
      {/* ── 撤销/重做 ── */}
      <div className="flex items-center gap-0.5">
        <ToolBtn
          onClick={() => editor.chain().focus().undo().run()}
          title="撤销 Ctrl+Z"
        >
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().redo().run()}
          title="重做 Ctrl+Shift+Z"
        >
          <Redo2 className="h-4 w-4" />
        </ToolBtn>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* ── 段落类型（标题下拉） ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="段落类型"
            className="hover:bg-accent text-muted-foreground flex items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors"
          >
            <Pilcrow className="h-4 w-4" />
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            <Pilcrow className="mr-2 h-4 w-4" /> 正文
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {HEADINGS.map(({ level, label, icon: Icon }) => (
            <DropdownMenuItem
              key={level}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level }).run()
              }
            >
              <Icon className="mr-2 h-4 w-4" /> {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* ── 内联格式 ── */}
      <div className="flex items-center gap-0.5">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="加粗 Ctrl+B"
        >
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="斜体 Ctrl+I"
        >
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="删除线"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="行内代码 Ctrl+E"
        >
          <Code className="h-4 w-4" />
        </ToolBtn>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* ── 列表 ── */}
      <div className="flex items-center gap-0.5">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="无序列表"
        >
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="有序列表"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive("taskList")}
          title="任务列表"
        >
          <ListChecks className="h-4 w-4" />
        </ToolBtn>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* ── 块级元素 ── */}
      <div className="flex items-center gap-0.5">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="引用"
        >
          <Quote className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="代码块"
        >
          <Code2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="分割线"
        >
          <Minus className="h-4 w-4" />
        </ToolBtn>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* ── AI 写作 ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isAiRunning}
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isAiRunning ? "生成中…" : "AI 写作"}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {WRITE_COMMANDS.map(({ action, label, desc }) => (
            <DropdownMenuItem
              key={action}
              onClick={() => onWriteAi(action)}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground text-[0.7rem]">
                {desc}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 推到右侧：保存状态 */}
      <div className="ml-auto">
        <span className="text-muted-foreground text-[0.7rem]">
          {saveState === "saving" ? "保存中…" : "已保存"}
        </span>
      </div>
    </div>
  );
}

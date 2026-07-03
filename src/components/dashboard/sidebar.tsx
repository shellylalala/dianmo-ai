"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  FilePlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  LogOut,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  createDocument,
  deleteDocument,
  renameDocument,
  handleSignOut,
} from "@/lib/actions";

// ---- 类型 ----
type Doc = {
  id: string;
  title: string;
  folderId: string | null;
  updatedAt: Date;
};

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

// ---- 主组件 ----
export function Sidebar({ docs, user }: { docs: Doc[]; user: User }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // 重命名 dialog 状态
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // 删除确认 dialog 状态
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  function openRename(doc: Doc) {
    setRenameTarget({ id: doc.id, title: doc.title });
    setRenameValue(doc.title);
    setRenameOpen(true);
  }

  function openDelete(doc: Doc) {
    setDeleteTarget({ id: doc.id, title: doc.title });
    setDeleteOpen(true);
  }

  function handleRename() {
    if (!renameTarget || !renameValue.trim()) return;
    startTransition(async () => {
      await renameDocument(renameTarget.id, renameValue.trim());
      toast.success("已重命名");
      setRenameOpen(false);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteDocument(deleteTarget.id);
      toast.success("已删除");
      setDeleteOpen(false);
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部 Logo + 新建 */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-base font-semibold tracking-tight">点墨 AI</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          title="新建文档"
          disabled={isPending}
          onClick={() => startTransition(() => createDocument())}
          type="button"
        >
          <FilePlus className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* 文档列表 */}
      <ScrollArea className="flex-1 px-2 py-2">
        {docs.length === 0 ? (
          <p className="text-muted-foreground px-2 py-4 text-center text-xs">
            暂无文档，点击 + 新建
          </p>
        ) : (
          <ul className="space-y-0.5">
            {docs.map((doc) => {
              const isActive = pathname === `/dashboard/${doc.id}`;
              return (
                <li key={doc.id} className="group relative flex items-center">
                  <Link
                    href={`/dashboard/${doc.id}`}
                    className={`flex flex-1 items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{doc.title || "无标题"}</span>
                  </Link>

                  {/* 三点菜单：hover 时出现 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`absolute right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 ${isActive ? "text-primary-foreground hover:bg-primary/80" : ""}`}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => openRename(doc)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDelete(doc)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>

      <Separator />

      {/* 底部用户 + 退出 */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {user.name ?? user.email}
          </p>
          {user.name && (
            <p className="text-muted-foreground truncate text-xs">
              {user.email}
            </p>
          )}
        </div>
        <form action={handleSignOut}>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            title="退出登录"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

      {/* 重命名 Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>重命名文档</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="文档标题"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRename} disabled={isPending}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            确定要删除「{deleteTarget?.title || "无标题"}」吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

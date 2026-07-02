"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
          点墨 AI
        </Link>
        <nav className="hidden gap-6 md:flex">
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            功能
          </a>
          <a
            href="#core"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            核心能力
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="切换主题"
          >
            <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
          <Button asChild size="sm">
            <Link href="/login">登录 / 注册</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

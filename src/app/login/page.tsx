import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-center text-2xl font-bold">登录 / 注册</h1>

      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/dashboard" });
        }}
      >
        <Button type="submit" className="w-full" variant="outline">
          使用 GitHub 登录
        </Button>
      </form>

      <div className="text-muted-foreground text-center text-xs">
        或使用邮箱魔法链接
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          await signIn("resend", formData);
        }}
        className="flex flex-col gap-3"
      >
        <Input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
        <Button type="submit" className="w-full">
          发送登录链接
        </Button>
      </form>
    </div>
  );
}

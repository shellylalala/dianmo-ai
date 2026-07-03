import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { listDocuments } from "@/lib/documents";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login"); // 权威校验（middleware 只是乐观）

  const docs = await listDocuments();

  return (
    <div className="flex h-screen">
      <aside className="border-border bg-muted/30 w-64 shrink-0 border-r">
        <Sidebar docs={docs} user={session.user} />
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
      <aside className="border-border hidden w-80 shrink-0 border-l xl:block">
        {/* P5 AI 面板占位 */}
        <div className="text-muted-foreground p-4 text-sm">AI 助手（P5）</div>
      </aside>
    </div>
  );
}

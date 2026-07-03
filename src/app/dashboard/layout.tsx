import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AiChat } from "@/components/dashboard/ai-chat";
import { EditorProvider } from "@/components/dashboard/editor-provider";
import { listDocuments } from "@/lib/documents";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const docs = await listDocuments();

  return (
    <EditorProvider>
      <div className="flex h-screen">
        <aside className="border-border bg-muted/30 w-64 shrink-0 border-r">
          <Sidebar docs={docs} user={session.user} />
        </aside>
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
        <aside className="border-border hidden w-80 shrink-0 overflow-hidden border-l xl:flex xl:flex-col">
          <AiChat />
        </aside>
      </div>
    </EditorProvider>
  );
}

import { notFound } from "next/navigation";
import { getDocument } from "@/lib/documents";

export default async function DocPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params; // Next 16: params 是 Promise，需 await
  const doc = await getDocument(docId);
  if (!doc) notFound(); // 非本人或不存在 → 404

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">{doc.title}</h1>
      <p className="text-muted-foreground mt-4">编辑器将在 P4 接入 Tiptap。</p>
    </div>
  );
}

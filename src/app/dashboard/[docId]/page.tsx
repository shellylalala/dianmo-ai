import { notFound } from "next/navigation";
import { getDocument } from "@/lib/documents";
import { Editor } from "@/components/dashboard/editor";
import type { JSONContent } from "@tiptap/react";

export default async function DocPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  const doc = await getDocument(docId);
  if (!doc) notFound();

  return (
    <Editor
      docId={doc.id}
      initialTitle={doc.title}
      initialContent={doc.content as JSONContent | null}
    />
  );
}

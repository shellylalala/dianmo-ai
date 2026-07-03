import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session.user.id;
}

export async function listDocuments() {
  const ownerId = await requireUserId();
  return prisma.document.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, folderId: true, updatedAt: true },
  });
}

export async function getDocument(id: string) {
  const ownerId = await requireUserId();
  const doc = await prisma.document.findFirst({ where: { id, ownerId } });
  return doc; // 非本人文档 → null（防 IDOR）
}

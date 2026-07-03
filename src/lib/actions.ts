"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}

async function uid() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("UNAUTHENTICATED");
  return s.user.id;
}
export async function createDocument(folderId?: string) {
  const ownerId = await uid();
  const doc = await prisma.document.create({ data: { ownerId, folderId } });
  revalidatePath("/dashboard");
  redirect(`/dashboard/${doc.id}`);
}

export async function renameDocument(id: string, title: string) {
  const ownerId = await uid();
  await prisma.document.updateMany({ where: { id, ownerId }, data: { title } });
  revalidatePath("/dashboard");
}

export async function deleteDocument(id: string) {
  const ownerId = await uid();
  await prisma.document.deleteMany({ where: { id, ownerId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateDocumentContent(
  id: string,
  content: Prisma.InputJsonValue,
) {
  const ownerId = await uid();
  await prisma.document.updateMany({
    where: { id, ownerId },
    data: { content },
  });
}

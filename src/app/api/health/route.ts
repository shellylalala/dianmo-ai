import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
  const count = await prisma.healthCheck.count();
  return NextResponse.json({ status: "ok", count });
};

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "TEACHER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const classroom = searchParams.get("classroom");
  const search = searchParams.get("search");

  const users = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(classroom ? { classroom } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      sessions: {
        include: { stage: { include: { category: true } } },
        orderBy: { playedAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

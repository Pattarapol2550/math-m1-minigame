import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "TEACHER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const feedback = await prisma.feedback.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(category ? { category: category as any } : {}),
    },
    include: {
      user: { select: { name: true, nickname: true, studentId: true, grade: true, room: true } },
      stage: { select: { name: true, category: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(feedback);
}

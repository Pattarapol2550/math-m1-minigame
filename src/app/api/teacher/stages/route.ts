import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireTeacher() {
  const session = await auth();
  if (!session || (session.user as any).role !== "TEACHER") return null;
  return session;
}

export async function GET() {
  if (!await requireTeacher()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: { _count: { select: { questions: true } } },
      },
    },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  if (!await requireTeacher()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { categoryId, name, enemyName, order } = await req.json();
  if (!categoryId || !name) return NextResponse.json({ error: "categoryId and name required" }, { status: 400 });

  const stage = await prisma.stage.create({
    data: {
      categoryId,
      name,
      enemyName: enemyName || "มังกรคณิต",
      enemyEmoji: "🐉",
      order: order ?? 99,
    },
    include: { _count: { select: { questions: true } } },
  });
  return NextResponse.json(stage, { status: 201 });
}

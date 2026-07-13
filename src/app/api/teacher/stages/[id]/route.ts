import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireTeacher() {
  const session = await auth();
  if (!session || (session.user as any).role !== "TEACHER") return null;
  return session;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireTeacher()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { name, enemyName, order, categoryId } = await req.json();
  const stage = await prisma.stage.update({
    where: { id },
    data: { name, enemyName, order, categoryId },
    include: { _count: { select: { questions: true } } },
  });
  return NextResponse.json(stage);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireTeacher()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.stage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

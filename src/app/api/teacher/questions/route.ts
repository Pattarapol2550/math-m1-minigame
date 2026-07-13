import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkTeacher() {
  const session = await auth();
  return (session?.user as any)?.role === "TEACHER";
}

export async function GET(req: NextRequest) {
  if (!(await checkTeacher())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const stageId = searchParams.get("stageId");
  const questions = await prisma.question.findMany({
    where: stageId ? { stageId } : {},
    orderBy: { order: "asc" },
  });
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  if (!(await checkTeacher())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const q = await prisma.question.create({ data: body });
  return NextResponse.json(q);
}

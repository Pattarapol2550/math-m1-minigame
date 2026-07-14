import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIES = ["BUG", "SUGGESTION", "QUESTION", "OTHER"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feedback = await prisma.feedback.findMany({
    where: { userId: session.user.id },
    include: { stage: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(feedback);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, stageId, message, rating } = body;

  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "ประเภทไม่ถูกต้อง" }, { status: 400 });
  }
  const trimmed = String(message ?? "").trim();
  if (!trimmed || trimmed.length > 2000) {
    return NextResponse.json({ error: "กรุณากรอกข้อความ (ไม่เกิน 2000 ตัวอักษร)" }, { status: 400 });
  }
  let ratingNum: number | null = null;
  if (rating !== undefined && rating !== null && rating !== "") {
    ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "คะแนนต้องเป็น 1-5" }, { status: 400 });
    }
  }

  let validStageId: string | null = null;
  if (stageId) {
    const stage = await prisma.stage.findUnique({ where: { id: stageId } });
    if (stage) validStageId = stage.id;
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: session.user.id,
      category,
      stageId: validStageId,
      message: trimmed,
      rating: ratingNum,
    },
  });

  return NextResponse.json(feedback, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { stageId, score, correct, total, hpLeft, passed, timeSpent, attempts } = body;

  const gameSession = await prisma.gameSession.create({
    data: {
      userId: session.user.id,
      stageId,
      score,
      correct,
      total,
      hpLeft,
      passed,
      timeSpent,
      attempts: {
        create: attempts.map((a: any) => ({
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: a.isCorrect,
          timeSpent: a.timeSpent,
        })),
      },
    },
  });
  return NextResponse.json(gameSession);
}

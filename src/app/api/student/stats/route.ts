import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.gameSession.findMany({
    where: { userId: session.user.id },
    include: { stage: { include: { category: true } } },
    orderBy: { playedAt: "desc" },
  });

  const totalScore = sessions.reduce((s, g) => s + g.score, 0);
  const totalCorrect = sessions.reduce((s, g) => s + g.correct, 0);
  const totalQuestions = sessions.reduce((s, g) => s + g.total, 0);
  const totalTime = sessions.reduce((s, g) => s + g.timeSpent, 0);

  return NextResponse.json({
    totalScore,
    totalCorrect,
    totalQuestions,
    accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    totalTime,
    sessions,
    recent: sessions.slice(0, 5),
  });
}

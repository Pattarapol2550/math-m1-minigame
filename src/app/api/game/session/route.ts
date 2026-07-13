import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeSession, clampTime, type RawAttempt } from "@/lib/game";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { stageId, attempts } = body;

  if (typeof stageId !== "string" || !Array.isArray(attempts) || attempts.length === 0) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Verify the stage exists
  const stage = await prisma.stage.findUnique({ where: { id: stageId } });
  if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  // Normalise + cap the attempts we accept
  const rawAttempts: RawAttempt[] = attempts.slice(0, 50).map((a: any) => ({
    questionId: String(a?.questionId ?? ""),
    answer: String(a?.answer ?? ""),
    timeSpent: clampTime(Number(a?.timeSpent)),
  }));

  // Build the authoritative answer key from the DB. Only questions that
  // actually belong to this stage count — anything else grades as wrong.
  const ids = rawAttempts.map(a => a.questionId).filter(Boolean);
  const questions = await prisma.question.findMany({
    where: { id: { in: ids }, stageId },
    select: { id: true, data: true },
  });
  const answerKey = new Map<string, string>();
  for (const q of questions) {
    answerKey.set(q.id, (q.data as { answer: string }).answer);
  }

  const graded = gradeSession(rawAttempts, answerKey);

  const gameSession = await prisma.gameSession.create({
    data: {
      userId: session.user.id,
      stageId,
      score: graded.score,
      correct: graded.correct,
      total: graded.total,
      hpLeft: graded.hpLeft,
      passed: graded.passed,
      timeSpent: graded.attempts.reduce((s, a) => s + a.timeSpent, 0),
      attempts: {
        create: graded.attempts.map(a => ({
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: a.isCorrect,
          timeSpent: a.timeSpent,
        })),
      },
    },
  });

  // Return the server's authoritative result so the client can show the
  // real score/pass state instead of its own optimistic guess.
  return NextResponse.json({
    id: gameSession.id,
    score: graded.score,
    correct: graded.correct,
    total: graded.total,
    hpLeft: graded.hpLeft,
    passed: graded.passed,
  });
}

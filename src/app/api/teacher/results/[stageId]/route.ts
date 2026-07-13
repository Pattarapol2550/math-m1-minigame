import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ stageId: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "TEACHER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { stageId } = await params;

  const [stage, questions, sessions] = await Promise.all([
    prisma.stage.findUnique({ where: { id: stageId }, include: { category: true } }),
    prisma.question.findMany({ where: { stageId }, orderBy: { order: "asc" } }),
    prisma.gameSession.findMany({
      where: { stageId },
      orderBy: { playedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, grade: true, room: true } },
        attempts: { select: { questionId: true, answer: true, isCorrect: true, timeSpent: true } },
      },
    }),
  ]);

  // Latest session per student
  const latestByStudent: Record<string, typeof sessions[0]> = {};
  for (const sess of sessions) {
    if (!latestByStudent[sess.userId]) latestByStudent[sess.userId] = sess;
  }

  const studentSessions = Object.values(latestByStudent).sort((a, b) => {
    if (a.user.grade !== b.user.grade) return a.user.grade - b.user.grade;
    if (a.user.room !== b.user.room) return a.user.room - b.user.room;
    return a.user.name.localeCompare(b.user.name);
  });

  // attempts map: studentId → questionId → attempt
  const attemptsMap: Record<string, Record<string, { isCorrect: boolean; answer: string; timeSpent: number }>> = {};
  for (const sess of studentSessions) {
    attemptsMap[sess.userId] = {};
    for (const att of sess.attempts) {
      attemptsMap[sess.userId][att.questionId] = {
        isCorrect: att.isCorrect,
        answer: att.answer,
        timeSpent: att.timeSpent,
      };
    }
  }

  return NextResponse.json({
    stage,
    questions: questions.map(q => ({ id: q.id, body: q.body, data: q.data, order: q.order })),
    sessions: studentSessions.map(s => ({
      userId: s.userId,
      name: s.user.name,
      classroom: `ม.${s.user.grade}/${s.user.room}`,
      score: s.score,
      correct: s.correct,
      total: s.total,
      passed: s.passed,
      hpLeft: s.hpLeft,
      playedAt: s.playedAt,
    })),
    attemptsMap,
  });
}

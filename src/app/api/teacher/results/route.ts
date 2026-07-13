import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "TEACHER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [categories, students] = await Promise.all([
    prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { stages: { orderBy: { order: "asc" } } },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: [{ classroom: "asc" }, { name: "asc" }],
      include: {
        sessions: {
          orderBy: { playedAt: "desc" },
          select: { stageId: true, score: true, correct: true, total: true, passed: true, playedAt: true },
        },
      },
    }),
  ]);

  // Best session per student per stage
  const scores: Record<string, Record<string, { score: number; correct: number; total: number; passed: boolean; plays: number }>> = {};
  for (const s of students) {
    scores[s.id] = {};
    const byStage: Record<string, typeof s.sessions> = {};
    for (const sess of s.sessions) {
      if (!byStage[sess.stageId]) byStage[sess.stageId] = [];
      byStage[sess.stageId].push(sess);
    }
    for (const [stageId, sessions] of Object.entries(byStage)) {
      const best = sessions.reduce((a, b) => a.score >= b.score ? a : b);
      scores[s.id][stageId] = {
        score: best.score,
        correct: best.correct,
        total: best.total,
        passed: sessions.some(s => s.passed),
        plays: sessions.length,
      };
    }
  }

  return NextResponse.json({
    categories,
    students: students.map(s => ({ id: s.id, name: s.name, classroom: s.classroom })),
    scores,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Ranks students by their best-per-stage total score. Students see their own
// classroom by default (motivation without exposing the whole school).
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope"); // "class" | "all"

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const where =
    scope === "all"
      ? { role: "STUDENT" as const }
      : { role: "STUDENT" as const, grade: me.grade, room: me.room };

  const students = await prisma.user.findMany({
    where,
    select: {
      id: true,
      nickname: true,
      name: true,
      grade: true,
      room: true,
      sessions: { select: { stageId: true, score: true } },
    },
  });

  const ranked = students
    .map(s => {
      // best score per stage, summed
      const best: Record<string, number> = {};
      for (const g of s.sessions) {
        best[g.stageId] = Math.max(best[g.stageId] ?? 0, g.score);
      }
      const totalScore = Object.values(best).reduce((a, b) => a + b, 0);
      return {
        id: s.id,
        nickname: s.nickname || s.name,
        classroom: `ม.${s.grade}/${s.room}`,
        totalScore,
        stagesCleared: Object.keys(best).length,
        isMe: s.id === me.id,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  return NextResponse.json({
    scope: scope === "all" ? "all" : "class",
    myClassroom: `ม.${me.grade}/${me.room}`,
    leaderboard: ranked.slice(0, 100),
  });
}

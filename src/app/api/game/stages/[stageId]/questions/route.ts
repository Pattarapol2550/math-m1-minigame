import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUESTIONS_PER_STAGE } from "@/lib/game";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ stageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stageId } = await params;
  const questions = await prisma.question.findMany({
    where: { stageId },
    orderBy: { order: "asc" },
  });

  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_STAGE);

  // IMPORTANT: never send the correct answer or hint to the client.
  // Grading happens server-side (see /api/game/answer and /api/game/session).
  const result = shuffled.map(q => {
    const data = q.data as { choices: string[]; answer: string; hint?: string };
    const choices = [...data.choices].sort(() => Math.random() - 0.5);
    return { id: q.id, body: q.body, order: q.order, data: { choices } };
  });

  return NextResponse.json(result);
}

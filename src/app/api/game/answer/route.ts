import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Grades a single answer server-side and returns whether it was correct,
// plus the correct answer + hint for feedback. The client never receives
// the answer until it has committed to a choice.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { questionId, answer } = await req.json();
  if (typeof questionId !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = question.data as { answer: string; hint?: string };
  const isCorrect = answer === data.answer;

  return NextResponse.json({
    isCorrect,
    correctAnswer: data.answer,
    hint: data.hint ?? null,
  });
}

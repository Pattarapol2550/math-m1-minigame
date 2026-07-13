import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ stageId: string }> }
) {
  const { stageId } = await params;
  const questions = await prisma.question.findMany({
    where: { stageId },
    orderBy: { order: "asc" },
  });
  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 10);
  // Shuffle choices within each question (answer stays as text value)
  const result = shuffled.map(q => {
    const data = q.data as { choices: string[]; answer: string; hint?: string };
    const choices = [...data.choices].sort(() => Math.random() - 0.5);
    return { ...q, data: { ...data, choices } };
  });
  return NextResponse.json(result);
}

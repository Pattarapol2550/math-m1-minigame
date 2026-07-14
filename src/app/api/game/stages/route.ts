import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: { _count: { select: { questions: true } } },
      },
    },
  });
  return NextResponse.json(categories);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "TEACHER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const firstName = searchParams.get("firstName")?.trim();
  const lastName = searchParams.get("lastName")?.trim();
  const nickname = searchParams.get("nickname")?.trim();
  const studentId = searchParams.get("studentId")?.trim();
  const grade = searchParams.get("grade")?.trim();
  const room = searchParams.get("room")?.trim();

  // Every provided field must match (AND). Missing fields are ignored.
  const and: Prisma.UserWhereInput[] = [];
  if (firstName) and.push({ firstName: { contains: firstName, mode: "insensitive" } });
  if (lastName) and.push({ lastName: { contains: lastName, mode: "insensitive" } });
  if (nickname) and.push({ nickname: { contains: nickname, mode: "insensitive" } });
  if (studentId) and.push({ studentId: { contains: studentId, mode: "insensitive" } });
  if (grade && !Number.isNaN(Number(grade))) and.push({ grade: Number(grade) });
  if (room && !Number.isNaN(Number(room))) and.push({ room: Number(room) });

  const users = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(and.length ? { AND: and } : {}),
    },
    include: {
      sessions: {
        include: { stage: { include: { category: true } } },
        orderBy: { playedAt: "desc" },
      },
    },
    orderBy: [{ grade: "asc" }, { room: "asc" }, { number: "asc" }],
  });

  const result = users.map(u => ({
    ...u,
    classroom: `ม.${u.grade}/${u.room}`,
  }));

  return NextResponse.json(result);
}

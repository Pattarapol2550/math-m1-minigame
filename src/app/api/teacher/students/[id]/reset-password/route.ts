import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "TEACHER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { password } = await req.json();

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }

  const student = await prisma.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") {
    return NextResponse.json({ error: "ไม่พบนักเรียน" }, { status: 404 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { password: hashed } });

  // Audit trail — record which teacher reset which student's password.
  await prisma.passwordResetLog.create({
    data: {
      targetUserId: student.id,
      targetStudentId: student.studentId,
      targetName: student.name,
      byUserId: (session.user as any).id,
      byName: session.user.name ?? "",
    },
  });

  return NextResponse.json({ ok: true });
}

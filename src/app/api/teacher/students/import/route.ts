import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Row {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  grade?: unknown;
  room?: unknown;
  number?: unknown;
  studentId?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "TEACHER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const rows: Row[] = Array.isArray(body?.students) ? body.students : [];
  if (rows.length === 0) return NextResponse.json({ error: "ไม่มีข้อมูล" }, { status: 400 });
  if (rows.length > 1000) return NextResponse.json({ error: "นำเข้าได้สูงสุด 1000 คนต่อครั้ง" }, { status: 400 });

  const errors: { row: number; studentId: string; reason: string }[] = [];
  const valid: Required<Omit<Row, "grade" | "room" | "number">> & { grade: number; room: number; number: number }[] = [] as any;
  const seen = new Set<string>();

  rows.forEach((r, i) => {
    const rowNum = i + 1;
    const studentId = String(r.studentId ?? "").trim();
    const firstName = String(r.firstName ?? "").trim();
    const lastName = String(r.lastName ?? "").trim();
    const nickname = String(r.nickname ?? "").trim();
    const grade = Number(r.grade);
    const room = Number(r.room);
    const number = Number(r.number);
    const password = String(r.password ?? "").trim() || studentId; // default = studentId

    if (!studentId || !firstName || !lastName || !nickname) {
      errors.push({ row: rowNum, studentId, reason: "ข้อมูลไม่ครบ" });
      return;
    }
    if (!Number.isInteger(grade) || grade < 1 || grade > 6) {
      errors.push({ row: rowNum, studentId, reason: "ชั้นไม่ถูกต้อง (1-6)" });
      return;
    }
    if (!Number.isInteger(room) || room < 1 || room > 16) {
      errors.push({ row: rowNum, studentId, reason: "ห้องไม่ถูกต้อง (1-16)" });
      return;
    }
    if (!Number.isInteger(number) || number < 1) {
      errors.push({ row: rowNum, studentId, reason: "เลขที่ไม่ถูกต้อง" });
      return;
    }
    if (password.length < 6) {
      errors.push({ row: rowNum, studentId, reason: "รหัสผ่านสั้นเกินไป (ต่ำกว่า 6)" });
      return;
    }
    if (seen.has(studentId)) {
      errors.push({ row: rowNum, studentId, reason: "เลขประจำตัวซ้ำในไฟล์" });
      return;
    }
    seen.add(studentId);
    (valid as any).push({ firstName, lastName, nickname, grade, room, number, studentId, password });
  });

  // Skip any studentId that already exists in the DB.
  const existing = await prisma.user.findMany({
    where: { studentId: { in: [...seen] } },
    select: { studentId: true },
  });
  const existingIds = new Set(existing.map(e => e.studentId));

  let created = 0;
  for (const v of valid as any[]) {
    if (existingIds.has(v.studentId)) {
      errors.push({ row: 0, studentId: v.studentId, reason: "มีบัญชีนี้อยู่แล้ว" });
      continue;
    }
    const hashed = await bcrypt.hash(v.password, 10);
    try {
      await prisma.user.create({
        data: {
          name: `${v.firstName} ${v.lastName}`,
          firstName: v.firstName,
          lastName: v.lastName,
          nickname: v.nickname,
          studentId: v.studentId,
          grade: v.grade,
          room: v.room,
          number: v.number,
          username: v.studentId,
          password: hashed,
          role: "STUDENT",
        },
      });
      created++;
    } catch {
      errors.push({ row: 0, studentId: v.studentId, reason: "สร้างไม่สำเร็จ (อาจซ้ำ)" });
    }
  }

  return NextResponse.json({ created, errors, totalRows: rows.length });
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { firstName, lastName, nickname, grade, room, number, studentId, password } = body;

  if (
    !firstName?.trim() ||
    !lastName?.trim() ||
    !nickname?.trim() ||
    !studentId?.trim() ||
    !password
  ) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  const gradeNum = Number(grade);
  if (!Number.isInteger(gradeNum) || gradeNum < 1 || gradeNum > 6) {
    return NextResponse.json({ error: "ชั้นเรียนไม่ถูกต้อง" }, { status: 400 });
  }

  const roomNum = Number(room);
  if (!Number.isInteger(roomNum) || roomNum < 1 || roomNum > 16) {
    return NextResponse.json({ error: "ห้องต้องเป็นตัวเลข 1-16" }, { status: 400 });
  }

  const numberNum = Number(number);
  if (!Number.isInteger(numberNum) || numberNum < 1) {
    return NextResponse.json({ error: "เลขที่ไม่ถูกต้อง" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ studentId: studentId.trim() }, { username: studentId.trim() }],
    },
  });
  if (existing) {
    return NextResponse.json({ error: "รหัสประจำตัวนักเรียนนี้ถูกใช้แล้ว" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: `${firstName.trim()} ${lastName.trim()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim(),
      studentId: studentId.trim(),
      grade: gradeNum,
      room: roomNum,
      number: numberNum,
      username: studentId.trim(),
      password: hashed,
      role: "STUDENT",
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}

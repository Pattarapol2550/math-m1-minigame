import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "TEACHER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const gradeParam = searchParams.get("grade");
  const roomParam = searchParams.get("room");
  const categoryId = searchParams.get("categoryId");
  const grade = gradeParam && !Number.isNaN(Number(gradeParam)) ? Number(gradeParam) : undefined;
  const room = roomParam && !Number.isNaN(Number(roomParam)) ? Number(roomParam) : undefined;

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(grade !== undefined ? { grade } : {}),
      ...(room !== undefined ? { room } : {}),
    },
    include: {
      sessions: {
        where: categoryId ? { stage: { categoryId } } : undefined,
        include: { stage: { include: { category: true } } },
        orderBy: { playedAt: "desc" },
      },
    },
    orderBy: [{ grade: "asc" }, { room: "asc" }, { number: "asc" }],
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ผลการเล่น");

  ws.columns = [
    { header: "ชื่อ", key: "name", width: 20 },
    { header: "ห้องเรียน", key: "classroom", width: 12 },
    { header: "โหมด", key: "mode", width: 16 },
    { header: "ด่าน", key: "stage", width: 20 },
    { header: "คะแนน", key: "score", width: 10 },
    { header: "ตอบถูก", key: "correct", width: 10 },
    { header: "ทั้งหมด", key: "total", width: 10 },
    { header: "ผ่าน/ไม่ผ่าน", key: "passed", width: 14 },
    { header: "วันที่เล่น", key: "playedAt", width: 20 },
  ];

  ws.getRow(1).font = { bold: true };

  for (const student of students) {
    for (const s of student.sessions) {
      ws.addRow({
        name: student.name,
        classroom: `ม.${student.grade}/${student.room}`,
        mode: s.stage.category.name,
        stage: s.stage.name,
        score: s.score,
        correct: s.correct,
        total: s.total,
        passed: s.passed ? "ผ่าน" : "ไม่ผ่าน",
        playedAt: s.playedAt.toLocaleString("th-TH"),
      });
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const parts = ["math-results"];
  if (grade !== undefined) parts.push(`ม${grade}${room !== undefined ? `-${room}` : ""}`);
  const filename = parts.join("-") + ".xlsx";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

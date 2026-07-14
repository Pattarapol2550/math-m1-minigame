// Deletes every disposable e2e_* test account (and its sessions/feedback)
// created during this test run, so automated runs never leave junk data
// behind in the real database.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export default async function globalTeardown() {
  if (!process.env.DATABASE_URL) return;

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const users = await prisma.user.findMany({ where: { studentId: { startsWith: "e2e_" } } });
    if (users.length === 0) return;

    const userIds = users.map(u => u.id);
    const sessions = await prisma.gameSession.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
    const sessionIds = sessions.map(s => s.id);

    await prisma.$transaction([
      prisma.questionAttempt.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.gameSession.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.feedback.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.loginAttempt.deleteMany({ where: { username: { startsWith: "e2e_" } } }),
      prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);
    console.log(`[teardown] cleaned up ${users.length} e2e test account(s)`);
  } finally {
    await prisma.$disconnect();
  }
}

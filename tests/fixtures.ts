import { test as base, expect, type APIRequestContext } from "@playwright/test";

// Seed data (student1, teacher, etc.) is real classroom data that can be
// edited or deleted at any time by the teacher. Tests must not depend on it
// staying in a particular shape — so each run registers its own disposable
// student account and logs in as that instead.

export const TEST_PASSWORD = "e2e-test-pass-123";

export function uniqueStudentId() {
  return `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export async function registerStudent(request: APIRequestContext, studentId: string) {
  const res = await request.post("/api/register", {
    data: {
      firstName: "E2E",
      lastName: "Test",
      nickname: "e2e",
      grade: "1",
      room: "1",
      number: "1",
      studentId,
      password: TEST_PASSWORD,
    },
  });
  if (!res.ok()) {
    throw new Error(`Failed to register test student: ${res.status()} ${await res.text()}`);
  }
}

export const test = base.extend<{ studentId: string }>({
  // A fresh, disposable student account per test — never collides with real data.
  studentId: async ({ request }, use) => {
    const id = uniqueStudentId();
    await registerStudent(request, id);
    await use(id);
  },
});

export { expect };
